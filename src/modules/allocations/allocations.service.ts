import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as moment from 'moment';
import { DailyAllocationEntity } from 'src/database/postgres/entities/daily-allocation.entity';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

export interface UpsertAllocation {
    userId: string;
    projectId: string;
    date: string;       // YYYY-MM-DD
    plannedHours: number;
}

@Injectable()
export class AllocationsService {
    private readonly logger = new Logger(AllocationsService.name);

    constructor(
        @InjectRepository(DailyAllocationEntity) private readonly repo: Repository<DailyAllocationEntity>,
    ) { }

    async grid(filters: {
        from: string;
        to: string;
        projectIds?: string[];
        userIds?: string[];
    }): Promise<DailyAllocationEntity[]> {
        const where: any = {
            date: Between(filters.from, filters.to),
        };
        if (filters.projectIds && filters.projectIds.length) where.projectId = In(filters.projectIds);
        if (filters.userIds && filters.userIds.length) where.userId = In(filters.userIds);
        return this.repo.find({
            where,
            relations: ['user', 'project'],
            order: { date: 'ASC' },
        });
    }

    /**
     * Bulk upsert. Past-dated cells are blocked unless the caller is
     * SENIOR_MANAGER or ADMIN. Cells with plannedHours = 0 are deleted to
     * keep the table tidy.
     */
    async bulkUpsert(items: UpsertAllocation[], caller: UserEntity): Promise<{ upserted: number; deleted: number }> {
        if (!Array.isArray(items) || items.length === 0) return { upserted: 0, deleted: 0 };
        const callerRoleId: string | undefined = (caller as any)?.role?.id;
        const canEditPast = !!callerRoleId && (ADMIN_ROLES.has(callerRoleId) || callerRoleId === 'SENIOR_MANAGER');
        const today = moment().format('YYYY-MM-DD');
        let upserted = 0;
        let deleted = 0;
        for (const it of items) {
            if (!it.userId || !it.projectId || !it.date) {
                throw new BadRequestException('userId, projectId, and date are required on every allocation');
            }
            if (!canEditPast && it.date < today) {
                throw new ForbiddenException(`Past-week allocations are locked. ${it.date} can only be edited by senior managers or admins.`);
            }
            if (!Number.isFinite(it.plannedHours) || it.plannedHours < 0 || it.plannedHours > 24) {
                throw new BadRequestException(`plannedHours must be between 0 and 24, got ${it.plannedHours}`);
            }
            if (it.plannedHours === 0) {
                const r = await this.repo.delete({ userId: it.userId, projectId: it.projectId, date: it.date } as any);
                deleted += r.affected ?? 0;
                continue;
            }
            const existing = await this.repo.findOne({
                where: { userId: it.userId, projectId: it.projectId, date: it.date } as any,
            });
            if (existing) {
                existing.plannedHours = String(it.plannedHours);
                existing.plannedBy = caller;
                existing.plannedAt = new Date();
                await this.repo.save(existing);
            } else {
                await this.repo.save(this.repo.create({
                    userId: it.userId,
                    projectId: it.projectId,
                    date: it.date,
                    plannedHours: String(it.plannedHours),
                    plannedBy: caller,
                    plannedAt: new Date(),
                } as any));
            }
            upserted++;
        }
        return { upserted, deleted };
    }

    /**
     * Copy a user's last week's allocations forward into the upcoming week.
     * Convenience action wired to a "Copy week forward" button on the grid.
     */
    async copyWeekForward(userId: string, sourceWeekStart: string, caller: UserEntity): Promise<number> {
        const source = await this.repo.find({
            where: { userId, date: Between(sourceWeekStart, moment(sourceWeekStart).add(6, 'days').format('YYYY-MM-DD')) },
        });
        if (source.length === 0) return 0;
        const items: UpsertAllocation[] = source.map((s) => ({
            userId: s.userId,
            projectId: s.projectId,
            date: moment(s.date).add(7, 'days').format('YYYY-MM-DD'),
            plannedHours: Number(s.plannedHours),
        }));
        const result = await this.bulkUpsert(items, caller);
        return result.upserted;
    }
}
