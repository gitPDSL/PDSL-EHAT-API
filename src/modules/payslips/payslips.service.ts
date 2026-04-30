import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayslipDocumentEntity } from 'src/database/postgres/entities/payslip-document.entity';
import { PayrollPeriodEntity } from 'src/database/postgres/entities/payroll-period.entity';
import { UserEntity, EMPLOYMENT_TYPE } from 'src/database/postgres/entities/user.entity';
import { AuditService } from 'src/modules/audit/audit.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MailService } from 'src/mail/mail.service';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

const MAX_BYTES = 5 * 1024 * 1024; // 5MB cap per payslip

@Injectable()
export class PayslipsService {
    private readonly logger = new Logger(PayslipsService.name);

    constructor(
        @InjectRepository(PayslipDocumentEntity) private readonly payslipRepo: Repository<PayslipDocumentEntity>,
        @InjectRepository(PayrollPeriodEntity) private readonly periodRepo: Repository<PayrollPeriodEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        private readonly auditService: AuditService,
        private readonly notifications: NotificationsService,
        private readonly mailService: MailService,
    ) { }

    async upload(input: {
        userId: string;
        payrollPeriodId: string;
        filename: string;
        contentType: string;
        sizeBytes: number;
        buffer: Buffer;
    }, currentUser: UserEntity): Promise<PayslipDocumentEntity> {
        if (!input.userId || !input.payrollPeriodId) {
            throw new BadRequestException('userId and payrollPeriodId are required');
        }
        if (!input.buffer || input.buffer.length === 0) {
            throw new BadRequestException('Empty file');
        }
        if (input.buffer.length > MAX_BYTES) {
            throw new BadRequestException(`File exceeds ${MAX_BYTES} byte limit`);
        }
        if (input.contentType !== 'application/pdf') {
            throw new BadRequestException('Only PDF payslips are accepted');
        }
        const user = await this.userRepo.findOne({ where: { id: input.userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.employmentType === EMPLOYMENT_TYPE.CONTRACTOR) {
            throw new BadRequestException('Contractors do not receive payslips');
        }
        const period = await this.periodRepo.findOne({ where: { id: input.payrollPeriodId } });
        if (!period) throw new NotFoundException('Payroll period not found');

        // Upsert: replace existing payslip for the same (user, period).
        const existing = await this.payslipRepo.findOne({ where: { userId: input.userId, payrollPeriodId: input.payrollPeriodId } });
        const isReplacement = !!existing;
        let saved: any;
        if (existing) {
            existing.filename = input.filename;
            existing.contentType = input.contentType;
            existing.sizeBytes = input.sizeBytes;
            (existing as any).content = input.buffer;
            existing.uploadedAt = new Date();
            existing.uploadedBy = currentUser;
            saved = await this.payslipRepo.save(existing);
        } else {
            const created = this.payslipRepo.create({
                userId: input.userId,
                payrollPeriodId: input.payrollPeriodId,
                filename: input.filename,
                contentType: input.contentType,
                sizeBytes: input.sizeBytes,
                content: input.buffer,
                uploadedBy: currentUser,
                uploadedAt: new Date(),
            } as any);
            saved = await this.payslipRepo.save(created as any);
        }

        try {
            await this.auditService.log({
                actorId: currentUser?.id ?? null,
                action: isReplacement ? 'payslip.replaced' : 'payslip.uploaded',
                entityType: 'PayslipDocument',
                entityId: saved.id,
                before: null,
                after: { userId: input.userId, periodId: input.payrollPeriodId, sizeBytes: input.sizeBytes },
            });
        } catch (error: any) {
            this.logger.warn(`Audit log failed on payslip upload: ${error?.message ?? error}`);
        }

        try {
            const link = `${process.env.APP_URL ?? ''}/my-payslips`;
            await this.notifications.create({
                userId: input.userId,
                type: 'payslip.published',
                title: isReplacement ? 'Payslip updated' : 'New payslip available',
                body: `A payslip for the period ${period.startDate} - ${period.endDate} is now available.`,
                metadata: { payslipId: saved.id, link },
            });
            if (user.email) {
                await this.mailService.sendGeneric(
                    user.email,
                    'Your payslip is ready',
                    `A payslip for the period ${period.startDate} - ${period.endDate} has been uploaded to eHAT.`,
                    { recipientName: user.fullName ?? 'there', link },
                );
            }
        } catch (error: any) {
            this.logger.warn(`Failed to notify payslip recipient ${input.userId}: ${error?.message ?? error}`);
        }

        // Strip the bytes from the response.
        const { content, ...rest } = saved;
        return rest as PayslipDocumentEntity;
    }

    async list(filters: { userId?: string; payrollPeriodId?: string }, caller: UserEntity): Promise<PayslipDocumentEntity[]> {
        const isAdmin = !!caller?.role?.id && ADMIN_ROLES.has(caller.role.id);
        // Non-admins can only list their own.
        const effectiveUserId = isAdmin ? filters.userId : caller.id;
        const where: any = {};
        if (effectiveUserId) where.userId = effectiveUserId;
        if (filters.payrollPeriodId) where.payrollPeriodId = filters.payrollPeriodId;
        return this.payslipRepo.find({
            where,
            relations: ['payrollPeriod', 'user', 'uploadedBy'],
            order: { uploadedAt: 'DESC' },
        });
    }

    async download(id: string, caller: UserEntity): Promise<{ payslip: PayslipDocumentEntity; bytes: Buffer }> {
        const payslip = await this.payslipRepo
            .createQueryBuilder('p')
            .addSelect('p.content')
            .where('p.id = :id', { id })
            .getOne();
        if (!payslip) throw new NotFoundException('Payslip not found');
        const isAdmin = !!caller?.role?.id && ADMIN_ROLES.has(caller.role.id);
        if (!isAdmin && payslip.userId !== caller.id) {
            throw new ForbiddenException('You can only download your own payslips');
        }
        return { payslip, bytes: (payslip as any).content as Buffer };
    }

    async remove(id: string, caller: UserEntity): Promise<void> {
        const isAdmin = !!caller?.role?.id && ADMIN_ROLES.has(caller.role.id);
        if (!isAdmin) throw new ForbiddenException('Only admins can delete payslips');
        const existing = await this.payslipRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Payslip not found');
        await this.payslipRepo.delete(id);
        try {
            await this.auditService.log({
                actorId: caller?.id ?? null,
                action: 'payslip.deleted',
                entityType: 'PayslipDocument',
                entityId: id,
                before: { userId: existing.userId, periodId: existing.payrollPeriodId },
                after: null,
            });
        } catch (error: any) {
            this.logger.warn(`Audit log failed on payslip delete: ${error?.message ?? error}`);
        }
    }
}
