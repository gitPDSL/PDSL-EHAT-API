import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PayrollPeriodEntity } from 'src/database/postgres/entities/payroll-period.entity';
import { CreatePayrollPeriodDto, UpdatePayrollPeriodDto } from '../dto/payroll-period.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { AuditService } from 'src/modules/audit/audit.service';

@Injectable()
export class PayrollService {
    private readonly logger = new Logger(PayrollService.name);

    constructor(
        @InjectRepository(PayrollPeriodEntity) private readonly repo: Repository<PayrollPeriodEntity>,
        private readonly auditService: AuditService,
    ) { }

    async create(data: CreatePayrollPeriodDto, currentUser: UserEntity | null = null) {
        if (data.startDate > data.endDate) {
            throw new BadRequestException('startDate must be on or before endDate');
        }
        const entity = this.repo.create({
            startDate: data.startDate,
            endDate: data.endDate,
            createdBy: currentUser ?? undefined,
        } as any);
        return this.repo.save(entity);
    }

    findAll() {
        return this.repo.find({ order: { startDate: 'DESC' } });
    }

    async findById(id: string) {
        const period = await this.repo.findOne({ where: { id } });
        if (!period) throw new NotFoundException('Payroll period not found');
        return period;
    }

    async update(id: string, data: UpdatePayrollPeriodDto, currentUser: UserEntity | null = null) {
        const period: any = await this.findById(id);
        const wasLocked = period.lockedAt != null;
        if (data.startDate !== undefined) period.startDate = data.startDate;
        if (data.endDate !== undefined) period.endDate = data.endDate;
        if (data.lockedAt !== undefined) {
            period.lockedAt = data.lockedAt ? new Date(data.lockedAt) : null;
            period.lockedBy = data.lockedAt ? (currentUser ?? null) : null;
        }
        if (period.startDate > period.endDate) {
            throw new BadRequestException('startDate must be on or before endDate');
        }
        const saved = await this.repo.save(period);
        const isLocked = saved.lockedAt != null;
        if (wasLocked !== isLocked) {
            await this.auditService.log({
                actorId: currentUser?.id ?? null,
                action: isLocked ? 'payroll.period.lock' : 'payroll.period.unlock',
                entityType: 'PayrollPeriod',
                entityId: id,
                before: { lockedAt: wasLocked ? period.lockedAt : null },
                after: { lockedAt: isLocked ? saved.lockedAt : null },
            });
        }
        return saved;
    }

    async remove(id: string) {
        const period = await this.findById(id);
        if (period.lockedAt) {
            throw new BadRequestException('Cannot delete a locked payroll period');
        }
        return this.repo.delete(id);
    }

    async findLockedPeriodCovering(date: Date | string): Promise<PayrollPeriodEntity | null> {
        const day = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10);
        const period = await this.repo
            .createQueryBuilder('p')
            .where('p.start_date <= :day', { day })
            .andWhere('p.end_date >= :day', { day })
            .andWhere('p.locked_at IS NOT NULL')
            .getOne();
        return period ?? null;
    }
}
