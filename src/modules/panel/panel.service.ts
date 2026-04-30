import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import * as moment from 'moment';
import { ACCOUNT_STATUS, UserEntity } from 'src/database/postgres/entities/user.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { CorrectionRequestEntity, CORRECTION_STATUS } from 'src/database/postgres/entities/correction-request.entity';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const REPORTING_HOPS = 6;

interface PanelSummary {
    pendingHourApprovals: number;
    pendingLeaveApprovals: number;
    pendingCorrections: number;
    thisWeekHours: number;
    teamUtilisationPct: number;
}

@Injectable()
export class PanelService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(TimesheetEntity) private readonly tsRepo: Repository<TimesheetEntity>,
        @InjectRepository(LeaveEntity) private readonly leaveRepo: Repository<LeaveEntity>,
        @InjectRepository(CorrectionRequestEntity) private readonly correctionRepo: Repository<CorrectionRequestEntity>,
    ) { }

    private async reportingChain(callerId: string): Promise<Set<string>> {
        // Walk DOWN: who reports (transitively) up to callerId.
        const chain = new Set<string>();
        let frontier: string[] = [callerId];
        for (let i = 0; i < REPORTING_HOPS && frontier.length > 0; i++) {
            const directs: any[] = await this.userRepo
                .createQueryBuilder('u')
                .select('u.id', 'id')
                .where('u.manager_id IN (:...mids)', { mids: frontier })
                .getRawMany();
            const next: string[] = [];
            for (const d of directs) {
                if (!chain.has(d.id)) {
                    chain.add(d.id);
                    next.push(d.id);
                }
            }
            frontier = next;
        }
        return chain;
    }

    /**
     * Build the panel summary from the caller's perspective:
     *  - Admin sees all counts.
     *  - Senior manager sees counts scoped to their reporting chain.
     *  - Manager sees counts scoped to projects they own + their reportees.
     */
    async summary(caller: UserEntity): Promise<PanelSummary> {
        const callerRoleId = (caller as any)?.role?.id;
        const isAdmin = !!callerRoleId && ADMIN_ROLES.has(callerRoleId);

        const weekStart = moment().startOf('isoWeek').format('YYYY-MM-DD');
        const weekEnd = moment().endOf('isoWeek').format('YYYY-MM-DD');

        let pendingHourApprovals = 0;
        let pendingLeaveApprovals = 0;
        let pendingCorrections = 0;
        let thisWeekHours = 0;
        let teamUtilisationPct = 0;

        if (isAdmin) {
            pendingHourApprovals = await this.tsRepo
                .createQueryBuilder('t')
                .where(`t.status::text = 'SUBMITTED'`)
                .getCount();
            pendingLeaveApprovals = await this.leaveRepo
                .createQueryBuilder('l')
                .where(`l.status::text = 'PENDING'`)
                .getCount();
            pendingCorrections = await this.correctionRepo
                .createQueryBuilder('c')
                .where(`c.status = :s`, { s: CORRECTION_STATUS.PENDING })
                .getCount();
            const wkRow: any = await this.tsRepo
                .createQueryBuilder('t')
                .select('COALESCE(SUM(t.hours), 0)', 'total')
                .where('t.date BETWEEN :from AND :to', { from: weekStart, to: weekEnd })
                .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: 'REJECTED' })
                .getRawOne();
            thisWeekHours = Number(wkRow?.total ?? 0);

            const targetRow: any = await this.userRepo
                .createQueryBuilder('u')
                .select('COALESCE(SUM(u.weekly_target_hours), 0)', 'total')
                .where('u.status = :st', { st: ACCOUNT_STATUS.ACTIVE })
                .getRawOne();
            const totalTarget = Number(targetRow?.total ?? 0);
            teamUtilisationPct = totalTarget > 0 ? Math.round((thisWeekHours / totalTarget) * 100) : 0;
        } else {
            const team = await this.reportingChain(caller.id);
            const teamIds = Array.from(team);
            // Plus the caller's own row in case they also log hours.
            teamIds.push(caller.id);

            if (teamIds.length > 0) {
                pendingHourApprovals = await this.tsRepo
                    .createQueryBuilder('t')
                    .leftJoin('projects', 'p', 'p.id = t.project_id')
                    .where(`t.status::text = 'SUBMITTED'`)
                    .andWhere(`(t.user_id IN (:...uids) OR p.manager_id = :cid)`, { uids: teamIds, cid: caller.id })
                    .getCount();
                pendingLeaveApprovals = await this.leaveRepo
                    .createQueryBuilder('l')
                    .where(`l.status::text = 'PENDING'`)
                    .andWhere(`l.user_id IN (:...uids)`, { uids: teamIds })
                    .getCount();
                pendingCorrections = await this.correctionRepo
                    .createQueryBuilder('c')
                    .leftJoin('c.timesheet', 't')
                    .where(`c.status = :s`, { s: CORRECTION_STATUS.PENDING })
                    .andWhere(`t.user_id IN (:...uids)`, { uids: teamIds })
                    .getCount();
                const wkRow: any = await this.tsRepo
                    .createQueryBuilder('t')
                    .select('COALESCE(SUM(t.hours), 0)', 'total')
                    .where('t.date BETWEEN :from AND :to', { from: weekStart, to: weekEnd })
                    .andWhere(`t.user_id IN (:...uids)`, { uids: teamIds })
                    .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: 'REJECTED' })
                    .getRawOne();
                thisWeekHours = Number(wkRow?.total ?? 0);
                const tgtRow: any = await this.userRepo
                    .createQueryBuilder('u')
                    .select('COALESCE(SUM(u.weekly_target_hours), 0)', 'total')
                    .where(`u.id IN (:...uids)`, { uids: teamIds })
                    .andWhere('u.status = :st', { st: ACCOUNT_STATUS.ACTIVE })
                    .getRawOne();
                const totalTarget = Number(tgtRow?.total ?? 0);
                teamUtilisationPct = totalTarget > 0 ? Math.round((thisWeekHours / totalTarget) * 100) : 0;
            }
        }

        return { pendingHourApprovals, pendingLeaveApprovals, pendingCorrections, thisWeekHours, teamUtilisationPct };
    }
}
