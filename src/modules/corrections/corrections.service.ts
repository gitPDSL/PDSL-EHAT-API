import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CORRECTION_STATUS, CorrectionRequestEntity } from 'src/database/postgres/entities/correction-request.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { TimesheetStatusEntity } from 'src/database/postgres/entities/timesheet-status.entity';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { AuditService } from 'src/modules/audit/audit.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const REPORTING_CHAIN_HOPS = 6;

@Injectable()
export class CorrectionsService {
    private readonly logger = new Logger(CorrectionsService.name);

    constructor(
        @InjectRepository(CorrectionRequestEntity) private readonly correctionRepository: Repository<CorrectionRequestEntity>,
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly auditService: AuditService,
        private readonly notificationsService: NotificationsService,
    ) { }

    private async isInReportingChain(candidateId: string, employeeId: string): Promise<boolean> {
        const visited = new Set<string>();
        let currentId: string | null = employeeId;
        for (let i = 0; i < REPORTING_CHAIN_HOPS && currentId; i++) {
            if (visited.has(currentId)) return false;
            visited.add(currentId);
            const u: any = await this.userRepository.findOne({ where: { id: currentId }, relations: ['manager'] });
            const managerId = u?.manager?.id ?? null;
            if (!managerId) return false;
            if (managerId === candidateId) return true;
            currentId = managerId;
        }
        return false;
    }

    private async canReview(timesheet: any, caller: any): Promise<boolean> {
        if (!caller) return false;
        if (caller.role?.id && ADMIN_ROLES.has(caller.role.id)) return true;
        if (caller.role?.id === 'SENIOR_MANAGER') {
            return this.isInReportingChain(caller.id, timesheet.userId);
        }
        return false;
    }

    async createForOwner(timesheetId: string, reason: string, owner: UserEntity): Promise<CorrectionRequestEntity> {
        if (!reason || !reason.trim()) {
            throw new BadRequestException('Reason is required');
        }
        const timesheet: any = await this.timesheetRepository.findOne({
            where: { id: timesheetId },
            relations: ['status'],
        });
        if (!timesheet) throw new NotFoundException('Timesheet not found');
        if (timesheet.userId !== owner.id) {
            throw new ForbiddenException('You can only request a correction on your own timesheet');
        }
        if (!timesheet.status?.id || timesheet.status.id === 'PENDING') {
            throw new BadRequestException('Timesheet is still editable; just edit it directly.');
        }
        const existing = await this.correctionRepository.findOne({
            where: { timesheetId, status: CORRECTION_STATUS.PENDING },
        });
        if (existing) {
            throw new BadRequestException('A correction request is already pending for this timesheet');
        }
        const created = this.correctionRepository.create({
            timesheetId,
            timesheet,
            requestedBy: owner,
            reason: reason.trim(),
            status: CORRECTION_STATUS.PENDING,
        } as any);
        const saved: any = await this.correctionRepository.save(created as any);
        await this.auditService.log({
            actorId: owner.id,
            action: 'timesheet.correction.requested',
            entityType: 'Timesheet',
            entityId: timesheetId,
            before: null,
            after: { reason: reason.trim() },
        });
        // Notify whoever can review (line manager + project manager) so they
        // see something on their panel. Cheap fan-out: line manager only.
        const ts: any = timesheet;
        const lineManagerId = (await this.userRepository.findOne({
            where: { id: ts.userId },
            relations: ['manager'],
        }))?.manager?.id;
        if (lineManagerId) {
            try {
                await this.notificationsService.create({
                    userId: lineManagerId,
                    type: 'timesheet.correction.requested',
                    title: 'Correction requested',
                    body: `${owner.fullName ?? owner.email ?? 'An employee'} asked to edit a ${ts.status?.id?.toLowerCase()} timesheet.`,
                    metadata: { timesheetId, link: `${process.env.APP_URL ?? ''}/corrections` },
                });
            } catch (error: any) {
                this.logger.warn(`Failed to notify line manager about correction request: ${error?.message ?? error}`);
            }
        }
        return saved;
    }

    async list(query: { status?: CORRECTION_STATUS; mine?: boolean }, caller: UserEntity): Promise<CorrectionRequestEntity[]> {
        const qb = this.correctionRepository
            .createQueryBuilder('cr')
            .leftJoinAndSelect('cr.timesheet', 'ts')
            .leftJoinAndSelect('cr.requestedBy', 'rb')
            .leftJoinAndSelect('cr.reviewedBy', 'rv')
            .orderBy('cr.created_at', 'DESC');
        if (query.status) {
            qb.andWhere('cr.status = :s', { s: query.status });
        }
        if (query.mine) {
            qb.andWhere('rb.id = :uid', { uid: caller.id });
        }
        return qb.getMany();
    }

    async review(
        id: string,
        decision: 'APPROVED' | 'DENIED',
        decisionNote: string | null,
        caller: UserEntity,
    ): Promise<CorrectionRequestEntity> {
        const cr: any = await this.correctionRepository.findOne({
            where: { id },
            relations: ['timesheet', 'timesheet.status', 'requestedBy'],
        });
        if (!cr) throw new NotFoundException('Correction request not found');
        if (cr.status !== CORRECTION_STATUS.PENDING) {
            throw new BadRequestException(`Correction is already ${cr.status.toLowerCase()}`);
        }
        const allowed = await this.canReview(cr.timesheet, caller);
        if (!allowed) {
            throw new ForbiddenException('Only senior managers in the reporting chain or admins can review correction requests');
        }
        cr.status = decision === 'APPROVED' ? CORRECTION_STATUS.APPROVED : CORRECTION_STATUS.DENIED;
        cr.decisionNote = decisionNote;
        cr.reviewedBy = caller;
        cr.reviewedAt = new Date();
        await this.correctionRepository.save(cr);

        if (decision === 'APPROVED') {
            // Revert timesheet to PENDING so the owner can edit it again.
            const prevStatusId = cr.timesheet?.status?.id ?? null;
            const ts: any = cr.timesheet;
            ts.status = { id: 'PENDING' } as TimesheetStatusEntity;
            ts.approvedBy = null;
            ts.approvedAt = null;
            ts.rejectionReason = null;
            await this.timesheetRepository.save(ts);
            await this.auditService.log({
                actorId: caller.id,
                action: 'timesheet.correction.approved',
                entityType: 'Timesheet',
                entityId: ts.id,
                before: { status: prevStatusId },
                after: { status: 'PENDING', correctionId: id },
            });
        } else {
            await this.auditService.log({
                actorId: caller.id,
                action: 'timesheet.correction.denied',
                entityType: 'Timesheet',
                entityId: cr.timesheet.id,
                before: null,
                after: { correctionId: id, note: decisionNote },
            });
        }

        // Notify the requester either way.
        try {
            const reqId = cr.requestedBy?.id;
            if (reqId) {
                await this.notificationsService.create({
                    userId: reqId,
                    type: `timesheet.correction.${decision.toLowerCase()}`,
                    title: decision === 'APPROVED' ? 'Correction approved' : 'Correction denied',
                    body: decision === 'APPROVED'
                        ? 'Your correction request was approved; the timesheet is now editable again.'
                        : `Your correction request was denied${decisionNote ? `: ${decisionNote}` : '.'}`,
                    metadata: { timesheetId: cr.timesheet.id, link: `${process.env.APP_URL ?? ''}/hours` },
                });
            }
        } catch (error: any) {
            this.logger.warn(`Failed to notify requester about correction decision: ${error?.message ?? error}`);
        }
        return cr;
    }
}
