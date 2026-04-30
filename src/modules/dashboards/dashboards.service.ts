import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { ACCOUNT_STATUS, EMPLOYMENT_TYPE, UserEntity } from 'src/database/postgres/entities/user.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { DailyAllocationEntity } from 'src/database/postgres/entities/daily-allocation.entity';

interface UtilisationRow {
    userId: string;
    fullName: string | null;
    email: string | null;
    targetHours: number;
    actualHours: number;
    plannedHours: number;
    utilisationPct: number;
}

interface ProjectBurnDownRow {
    projectId: string;
    name: string;
    allocatedHours: number;
    usedHours: number;
    plannedFutureHours: number;
    remainingHours: number;
}

@Injectable()
export class DashboardsService {
    private readonly logger = new Logger(DashboardsService.name);

    constructor(
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(TimesheetEntity) private readonly tsRepo: Repository<TimesheetEntity>,
        @InjectRepository(ProjectEntity) private readonly projectRepo: Repository<ProjectEntity>,
        @InjectRepository(DailyAllocationEntity) private readonly allocRepo: Repository<DailyAllocationEntity>,
    ) { }

    /**
     * Users counted on dashboards/utilisation: ACTIVE EMPLOYEEs only.
     * Admins are deliberately excluded from utilisation (they don't log
     * billable hours of their own). Contractors are excluded because we
     * don't track targets for them.
     */
    private async chargeableUsers(): Promise<UserEntity[]> {
        return this.userRepo
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.role', 'r')
            .where('u.status = :st', { st: ACCOUNT_STATUS.ACTIVE })
            .andWhere(`(u.employment_type IS NULL OR u.employment_type = :et)`, { et: EMPLOYMENT_TYPE.EMPLOYEE })
            .andWhere(`(r.id IS NULL OR r.id NOT IN (:...admins))`, { admins: ['ADMIN', 'SUPER_ADMIN'] })
            .getMany();
    }

    async summary(from: string, to: string): Promise<{
        utilisation: UtilisationRow[];
        billable: { billableHours: number; nonBillableHours: number };
        projectBurnDown: ProjectBurnDownRow[];
        overbooked: UtilisationRow[];
        underbooked: UtilisationRow[];
    }> {
        const [utilisation, billable, projectBurnDown] = await Promise.all([
            this.utilisation(from, to),
            this.billableSplit(from, to),
            this.projectBurnDown(),
        ]);
        const overbooked = utilisation.filter((u) => u.plannedHours > u.targetHours && u.targetHours > 0);
        const underbooked = utilisation.filter((u) => u.targetHours > 0 && u.actualHours < u.targetHours * 0.6);
        return { utilisation, billable, projectBurnDown, overbooked, underbooked };
    }

    private async utilisation(from: string, to: string): Promise<UtilisationRow[]> {
        const users = await this.chargeableUsers();
        // Pre-compute number of working days in range (Mon-Fri).
        const start = new Date(from);
        const end = new Date(to);
        let workingDays = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay();
            if (dow !== 0 && dow !== 6) workingDays++;
        }

        const out: UtilisationRow[] = [];
        for (const u of users) {
            try {
                const targetPerDay = Number((u as any).dailyTargetHours ?? 8);
                const target = workingDays * targetPerDay;
                const actualRow: any = await this.tsRepo
                    .createQueryBuilder('t')
                    .select('COALESCE(SUM(t.hours), 0)', 'total')
                    .where('t.user_id = :uid', { uid: u.id })
                    .andWhere('t.date BETWEEN :from AND :to', { from, to })
                    .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: 'REJECTED' })
                    .getRawOne();
                const plannedRow: any = await this.allocRepo
                    .createQueryBuilder('a')
                    .select('COALESCE(SUM(a.planned_hours), 0)', 'total')
                    .where('a.user_id = :uid', { uid: u.id })
                    .andWhere('a.date BETWEEN :from AND :to', { from, to })
                    .getRawOne();
                const actual = Number(actualRow?.total ?? 0);
                const planned = Number(plannedRow?.total ?? 0);
                out.push({
                    userId: u.id,
                    fullName: u.fullName,
                    email: u.email,
                    targetHours: target,
                    actualHours: actual,
                    plannedHours: planned,
                    utilisationPct: target > 0 ? Math.round((actual / target) * 100) : 0,
                });
            } catch (error: any) {
                this.logger.warn(`Utilisation row failed for user ${u.id}: ${error?.message ?? error}`);
            }
        }
        return out.sort((a, b) => b.utilisationPct - a.utilisationPct);
    }

    private async billableSplit(from: string, to: string): Promise<{ billableHours: number; nonBillableHours: number }> {
        try {
            const rows: any = await this.tsRepo
                .createQueryBuilder('t')
                .leftJoin('projects', 'p', 'p.id = t.project_id')
                .select('COALESCE(SUM(CASE WHEN COALESCE(t.billable, p.billable, true) THEN t.hours ELSE 0 END), 0)', 'billable')
                .addSelect('COALESCE(SUM(CASE WHEN COALESCE(t.billable, p.billable, true) THEN 0 ELSE t.hours END), 0)', 'nonBillable')
                .where('t.date BETWEEN :from AND :to', { from, to })
                .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: 'REJECTED' })
                .getRawOne();
            return {
                billableHours: Number(rows?.billable ?? 0),
                nonBillableHours: Number(rows?.nonBillable ?? 0),
            };
        } catch (error: any) {
            this.logger.warn(`Billable split failed: ${error?.message ?? error}`);
            return { billableHours: 0, nonBillableHours: 0 };
        }
    }

    private async projectBurnDown(): Promise<ProjectBurnDownRow[]> {
        const projects = await this.projectRepo.find();
        const today = new Date().toISOString().slice(0, 10);
        const out: ProjectBurnDownRow[] = [];
        for (const p of projects) {
            if (Number(p.allocatedHours) <= 0) continue;
            const usedRow: any = await this.tsRepo
                .createQueryBuilder('t')
                .select('COALESCE(SUM(t.hours), 0)', 'total')
                .where('t.project_id = :pid', { pid: p.id })
                .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: 'REJECTED' })
                .getRawOne();
            const plannedFutureRow: any = await this.allocRepo
                .createQueryBuilder('a')
                .select('COALESCE(SUM(a.planned_hours), 0)', 'total')
                .where('a.project_id = :pid', { pid: p.id })
                .andWhere('a.date >= :today', { today })
                .getRawOne();
            const used = Number(usedRow?.total ?? 0);
            const planned = Number(plannedFutureRow?.total ?? 0);
            out.push({
                projectId: p.id,
                name: p.name,
                allocatedHours: Number(p.allocatedHours),
                usedHours: used,
                plannedFutureHours: planned,
                remainingHours: Number(p.allocatedHours) - used,
            });
        }
        return out.sort((a, b) => a.remainingHours - b.remainingHours);
    }
}
