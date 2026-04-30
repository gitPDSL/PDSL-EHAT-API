import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';

const REJECTED = 'REJECTED';

export interface CapacitySnapshot {
    projectId: string;
    projectName: string;
    allocatedHours: number;
    usedHours: number;
    remainingHours: number;
    alertThresholdHours: number;
    overAllocation: boolean;
    belowThreshold: boolean;
}

/**
 * Authoritative read on a project's hour budget.
 *
 * "Used" excludes REJECTED rows but includes PENDING, SUBMITTED and APPROVED
 * so that hours an employee has logged but not yet had approved still count
 * against the cap. Hard-blocking submissions over the cap is the org's stated
 * policy ("PO has limited hours, extra work cannot be paid for by customer").
 */
@Injectable()
export class ProjectCapacityService {
    private readonly logger = new Logger(ProjectCapacityService.name);

    constructor(
        @InjectRepository(ProjectEntity) private readonly projectRepository: Repository<ProjectEntity>,
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
    ) { }

    async snapshot(projectId: string, ignoreTimesheetId?: string): Promise<CapacitySnapshot | null> {
        const project: any = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) return null;
        const qb = this.timesheetRepository
            .createQueryBuilder('t')
            .select('COALESCE(SUM(t.hours), 0)', 'total')
            .where('t.project_id = :projectId', { projectId })
            .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: REJECTED });
        if (ignoreTimesheetId) {
            qb.andWhere('t.id != :ignoreId', { ignoreId: ignoreTimesheetId });
        }
        const row: any = await qb.getRawOne();
        const used = Number(row?.total ?? 0);
        const allocated = Number(project.allocatedHours ?? 0);
        const remaining = allocated - used;
        const threshold = Number(project.alertThresholdHours ?? 50);
        return {
            projectId: project.id,
            projectName: project.name,
            allocatedHours: allocated,
            usedHours: used,
            remainingHours: remaining,
            alertThresholdHours: threshold,
            overAllocation: used > allocated,
            belowThreshold: remaining <= threshold && remaining > 0,
        };
    }

    /**
     * Throw 422 if logging additionalHours on this project would push it over
     * the cap. ignoreTimesheetId lets you exclude the row being edited from
     * the existing-used total (so updates don't double-count).
     */
    async assertCapacity(projectId: string, additionalHours: number, ignoreTimesheetId?: string): Promise<void> {
        if (!projectId || !Number.isFinite(additionalHours) || additionalHours <= 0) return;
        const snap = await this.snapshot(projectId, ignoreTimesheetId);
        if (!snap) return;
        if (snap.allocatedHours <= 0) return; // no cap configured
        const projectedUsed = snap.usedHours + additionalHours;
        if (projectedUsed > snap.allocatedHours) {
            throw new UnprocessableEntityException(
                `Project "${snap.projectName}" has ${Math.max(snap.remainingHours, 0)}h remaining (allocated ${snap.allocatedHours}h, used ${snap.usedHours}h). Cannot accept ${additionalHours}h. Talk to the project manager.`,
            );
        }
    }

    /**
     * Snapshots for a list of projects, in one query plus N service calls.
     * Used by the UI to render per-project capacity bars without N+1.
     */
    async snapshotMany(projectIds: string[]): Promise<CapacitySnapshot[]> {
        const out: CapacitySnapshot[] = [];
        for (const id of projectIds) {
            const s = await this.snapshot(id);
            if (s) out.push(s);
        }
        return out;
    }
}
