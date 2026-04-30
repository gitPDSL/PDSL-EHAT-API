import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as moment from 'moment';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { UserEntity, ACCOUNT_STATUS, EMPLOYMENT_TYPE } from 'src/database/postgres/entities/user.entity';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { CorrectionRequestEntity, CORRECTION_STATUS } from 'src/database/postgres/entities/correction-request.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { HolidaysService } from 'src/modules/holidays/services/holidays.service';

const UK_TZ = 'Europe/London';

@Injectable()
export class TimesheetCronService {
    private readonly logger = new Logger(TimesheetCronService.name);

    constructor(
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(ProjectEntity) private readonly projectRepository: Repository<ProjectEntity>,
        @InjectRepository(CorrectionRequestEntity) private readonly correctionRepository: Repository<CorrectionRequestEntity>,
        private readonly mailService: MailService,
        private readonly notifications: NotificationsService,
        private readonly holidaysService: HolidaysService,
    ) { }

    // Friday 15:00 UK time
    @Cron('0 15 * * 5', { name: 'timesheet.weekly-reminder', timeZone: UK_TZ })
    async weeklyReminder(): Promise<void> {
        this.logger.log('Running weekly timesheet reminder');
        const now = moment();
        const weekNumber = now.isoWeek();
        const year = now.isoWeekYear();
        const startOfWeek = now.clone().startOf('isoWeek');

        const allWeekdays: Array<{ date: string; label: string }> = [];
        for (let i = 0; i < 5; i++) {
            const day = startOfWeek.clone().add(i, 'days');
            allWeekdays.push({ date: day.format('YYYY-MM-DD'), label: day.format('ddd MMM D') });
        }

        const holidaySet = await this.holidaysService.findDatesInRange(
            allWeekdays[0].date,
            allWeekdays[allWeekdays.length - 1].date,
            'GB',
        );
        const weekdays = allWeekdays.filter((w) => !holidaySet.has(w.date));
        if (weekdays.length === 0) {
            this.logger.log('All weekdays this week are holidays; skipping weekly reminder');
            return;
        }

        const users = await this.userRepository.find({
            where: { status: ACCOUNT_STATUS.ACTIVE },
        });
        let sent = 0;
        for (const user of users) {
            if (!user.email) continue;
            try {
                const entries = await this.timesheetRepository.find({
                    where: { userId: user.id, weekNumber, year } as any,
                });
                const covered = new Set<string>();
                for (const ts of entries) {
                    if (!(ts as any).date) continue;
                    covered.add(moment((ts as any).date).format('YYYY-MM-DD'));
                }
                const missing = weekdays.filter((w) => !covered.has(w.date));
                if (missing.length === 0) continue;

                const missingLabels = missing.map((w) => w.label);
                const link = `${process.env.APP_URL ?? ''}/hours`;
                await this.mailService.sendWeeklyReminder(
                    user.email,
                    user.fullName ?? 'there',
                    missingLabels,
                    link,
                );
                await this.notifications.create({
                    userId: user.id,
                    type: 'timesheet.reminder',
                    title: 'Timesheet reminder',
                    body: `You still have ${missing.length} weekday${missing.length === 1 ? '' : 's'} to submit for week ${weekNumber}.`,
                    metadata: { weekNumber, year, missing: missingLabels, link },
                });
                sent++;
            } catch (error) {
                this.logger.error(
                    `Weekly reminder for user ${user.id} failed: ${error?.message ?? error}`,
                    error?.stack,
                );
            }
        }
        this.logger.log(`Weekly reminder sent to ${sent} users`);
    }

    // Daily 08:00 UK time
    @Cron('0 8 * * *', { name: 'timesheet.overdue-escalation', timeZone: UK_TZ })
    async overdueEscalation(): Promise<void> {
        this.logger.log('Running overdue timesheet escalation');
        const cutoff = moment().subtract(2, 'days').toDate();
        const overdue = await this.timesheetRepository.find({
            where: {
                status: { id: 'SUBMITTED' } as any,
                submittedAt: LessThan(cutoff) as any,
            },
            relations: ['user', 'user.manager', 'project', 'project.manager'],
        });

        const byManager = new Map<
            string,
            { manager: any; rows: Array<{ employeeName: string; weekNumber: number; daysOverdue: number }> }
        >();
        const nowMs = Date.now();
        for (const ts of overdue) {
            const manager = (ts as any).project?.manager ?? (ts as any).user?.manager;
            if (!manager?.email) continue;
            if (!byManager.has(manager.id)) {
                byManager.set(manager.id, { manager, rows: [] });
            }
            const submittedAt = (ts as any).submittedAt ? new Date((ts as any).submittedAt).getTime() : nowMs;
            const daysOverdue = Math.max(1, Math.floor((nowMs - submittedAt) / (24 * 3600 * 1000)));
            byManager.get(manager.id)!.rows.push({
                employeeName: (ts as any).user?.fullName ?? 'Employee',
                weekNumber: (ts as any).weekNumber,
                daysOverdue,
            });
        }

        let sent = 0;
        for (const { manager, rows } of byManager.values()) {
            try {
                const link = `${process.env.APP_URL ?? ''}/approvals`;
                await this.mailService.sendOverdueEscalation(
                    manager.email,
                    manager.fullName ?? 'there',
                    rows,
                    link,
                );
                await this.notifications.create({
                    userId: manager.id,
                    type: 'timesheet.overdue',
                    title: 'Overdue approvals',
                    body: `${rows.length} timesheet${rows.length === 1 ? '' : 's'} have been awaiting your approval for more than 2 days.`,
                    metadata: { count: rows.length, link },
                });
                sent++;
            } catch (error) {
                this.logger.error(
                    `Overdue escalation to manager ${manager.id} failed: ${error?.message ?? error}`,
                    error?.stack,
                );
            }
        }
        this.logger.log(`Overdue escalation sent to ${sent} managers`);
    }

    // Monday 09:00 UK time
    @Cron('0 9 * * 1', { name: 'timesheet.manager-digest', timeZone: UK_TZ })
    async managerDigest(): Promise<void> {
        this.logger.log('Running weekly manager digest');
        const pending = await this.timesheetRepository.find({
            where: { status: { id: 'SUBMITTED' } as any },
            relations: ['user', 'user.manager', 'project', 'project.manager'],
        });

        const byManager = new Map<string, { manager: any; rows: any[] }>();
        for (const ts of pending) {
            const manager = (ts as any).project?.manager ?? (ts as any).user?.manager;
            if (!manager?.email) continue;
            if (!byManager.has(manager.id)) {
                byManager.set(manager.id, { manager, rows: [] });
            }
            byManager.get(manager.id)!.rows.push(ts);
        }

        let sent = 0;
        for (const { manager, rows } of byManager.values()) {
            try {
                const byEmployee = new Map<string, { employeeName: string; pendingCount: number }>();
                for (const ts of rows) {
                    const userId = (ts as any).user?.id;
                    if (!userId) continue;
                    if (!byEmployee.has(userId)) {
                        byEmployee.set(userId, {
                            employeeName: (ts as any).user?.fullName ?? 'Employee',
                            pendingCount: 0,
                        });
                    }
                    byEmployee.get(userId)!.pendingCount++;
                }
                const breakdown = Array.from(byEmployee.values());
                const link = `${process.env.APP_URL ?? ''}/approvals`;
                await this.mailService.sendManagerDigest(
                    manager.email,
                    manager.fullName ?? 'there',
                    breakdown,
                    rows.length,
                    link,
                );
                await this.notifications.create({
                    userId: manager.id,
                    type: 'timesheet.digest',
                    title: `${rows.length} pending approval${rows.length === 1 ? '' : 's'}`,
                    body: `You have ${rows.length} timesheet${rows.length === 1 ? '' : 's'} awaiting your approval.`,
                    metadata: { totalPending: rows.length, link },
                });
                sent++;
            } catch (error) {
                this.logger.error(
                    `Manager digest to ${manager.id} failed: ${error?.message ?? error}`,
                    error?.stack,
                );
            }
        }
        this.logger.log(`Manager digest sent to ${sent} managers`);
    }

    /**
     * Friday 16:00 UK escalation. Any active EMPLOYEE who hasn't submitted
     * any timesheet rows for the current week gets a final-call email.
     * Skips users who already submitted at least one row this week (they're
     * working on it). Idempotent within the week via notification metadata.
     */
    @Cron('0 16 * * 5', { name: 'timesheet.friday-escalation', timeZone: UK_TZ })
    async fridayEscalation(): Promise<void> {
        this.logger.log('Running Friday hour-submission escalation');
        const now = moment();
        const weekNumber = now.isoWeek();
        const year = now.isoWeekYear();
        const weekStart = now.clone().startOf('isoWeek').format('YYYY-MM-DD');
        const weekEnd = now.clone().endOf('isoWeek').format('YYYY-MM-DD');
        const users = await this.userRepository.find({
            where: { status: ACCOUNT_STATUS.ACTIVE, employmentType: EMPLOYMENT_TYPE.EMPLOYEE },
        });
        let escalated = 0;
        for (const user of users) {
            try {
                const role = (user as any).role?.id;
                if (role === 'ADMIN' || role === 'SUPER_ADMIN') continue;
                const submitted: any = await this.timesheetRepository
                    .createQueryBuilder('t')
                    .select('COUNT(*)', 'count')
                    .where('t.user_id = :uid', { uid: user.id })
                    .andWhere('t.date BETWEEN :from AND :to', { from: weekStart, to: weekEnd })
                    .getRawOne();
                if (Number(submitted?.count ?? 0) > 0) continue;
                const link = `${process.env.APP_URL ?? ''}/hours`;
                if (user.email) {
                    await this.mailService.sendGeneric(
                        user.email,
                        `Final call: submit your hours for week ${weekNumber}`,
                        `You have not submitted any hours for week ${weekNumber} of ${year}. Please submit before end of day so your manager can approve in time.`,
                        { recipientName: user.fullName ?? 'there', link },
                    );
                }
                await this.notifications.create({
                    userId: user.id,
                    type: 'timesheet.escalation',
                    title: `Submit your hours for week ${weekNumber}`,
                    body: 'You haven\'t submitted anything for this week yet. Submit before end of day.',
                    metadata: { weekNumber, year, link },
                });
                escalated++;
            } catch (error: any) {
                this.logger.error(`Friday escalation failed for ${user.id}: ${error?.message ?? error}`, error?.stack);
            }
        }
        this.logger.log(`Friday escalation sent to ${escalated} users`);
    }

    /**
     * Daily 10:00 UK. Active projects with allocated_hours > 0 and zero
     * approved hours in the last 14 days nudge their project manager.
     * Latched on projects.idle_alerted_at so a project only pings once
     * per idle period.
     */
    @Cron('0 10 * * *', { name: 'project.idle-ping', timeZone: UK_TZ })
    async idleProjectPing(): Promise<void> {
        this.logger.log('Running idle-project ping sweep');
        const projects = await this.projectRepository.find({
            relations: ['manager', 'status'],
        });
        const cutoff = moment().subtract(14, 'days').format('YYYY-MM-DD');
        let pinged = 0;
        let cleared = 0;
        for (const project of projects) {
            try {
                const status = (project as any).status?.id ?? null;
                if (status !== 'ACTIVE') continue;
                if (!project.allocatedHours || project.allocatedHours <= 0) continue;
                const recent: any = await this.timesheetRepository
                    .createQueryBuilder('t')
                    .select('COUNT(*)', 'count')
                    .where('t.project_id = :pid', { pid: project.id })
                    .andWhere('t.date >= :cutoff', { cutoff })
                    .andWhere(`(t.status IS NULL OR t.status::text != :rejected)`, { rejected: 'REJECTED' })
                    .getRawOne();
                const isIdle = Number(recent?.count ?? 0) === 0;
                const alreadyAlerted = !!(project as any).idleAlertedAt;
                if (isIdle && !alreadyAlerted) {
                    const manager = (project as any).manager;
                    if (manager?.email) {
                        const link = `${process.env.APP_URL ?? ''}/projects`;
                        await this.mailService.sendGeneric(
                            manager.email,
                            `Project ${project.name} idle for 2+ weeks`,
                            `No approved hours have been logged on "${project.name}" in the last 14 days. Is the project still active?`,
                            { recipientName: manager.fullName ?? 'there', link },
                        );
                        await this.notifications.create({
                            userId: manager.id,
                            type: 'project.idle',
                            title: `${project.name} idle`,
                            body: `No approved hours on "${project.name}" in the last 14 days.`,
                            metadata: { projectId: project.id, link },
                        });
                    }
                    (project as any).idleAlertedAt = new Date();
                    await this.projectRepository.save(project);
                    pinged++;
                } else if (!isIdle && alreadyAlerted) {
                    (project as any).idleAlertedAt = null;
                    await this.projectRepository.save(project);
                    cleared++;
                }
            } catch (error: any) {
                this.logger.error(`Idle-project ping failed for ${project.id}: ${error?.message ?? error}`, error?.stack);
            }
        }
        this.logger.log(`Idle-project ping done: ${pinged} pinged, ${cleared} cleared`);
    }

    /**
     * Daily 09:30 UK. PENDING corrections older than 2 days nudge the
     * line + senior manager once. Latched on correction_requests.nudged_at.
     */
    @Cron('30 9 * * *', { name: 'corrections.stale-nudge', timeZone: UK_TZ })
    async staleCorrectionNudge(): Promise<void> {
        this.logger.log('Running stale-correction nudge sweep');
        const cutoff = moment().subtract(2, 'days').toDate();
        const stale = await this.correctionRepository
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.timesheet', 'ts')
            .leftJoinAndSelect('c.requestedBy', 'rb')
            .where('c.status = :s', { s: CORRECTION_STATUS.PENDING })
            .andWhere('c.created_at < :cutoff', { cutoff })
            .andWhere('c.nudged_at IS NULL')
            .getMany();
        let nudged = 0;
        for (const cr of stale) {
            try {
                const ts: any = (cr as any).timesheet;
                if (!ts?.userId) continue;
                const tsUser = await this.userRepository.findOne({
                    where: { id: ts.userId },
                    relations: ['manager'],
                });
                const lineMgr = tsUser?.manager;
                if (lineMgr?.email) {
                    const link = `${process.env.APP_URL ?? ''}/corrections`;
                    const requesterName = (cr as any).requestedBy?.fullName ?? 'an employee';
                    await this.mailService.sendGeneric(
                        lineMgr.email,
                        'Correction request waiting > 2 days',
                        `${requesterName} has a pending correction request that has been waiting more than 2 days. Please review.`,
                        { recipientName: lineMgr.fullName ?? 'there', link },
                    );
                    await this.notifications.create({
                        userId: lineMgr.id,
                        type: 'corrections.stale',
                        title: 'Correction request waiting',
                        body: `${requesterName}'s correction request has been pending more than 2 days.`,
                        metadata: { correctionId: cr.id, link },
                    });
                }
                (cr as any).nudgedAt = new Date();
                await this.correctionRepository.save(cr);
                nudged++;
            } catch (error: any) {
                this.logger.error(`Stale correction nudge failed for ${cr.id}: ${error?.message ?? error}`, error?.stack);
            }
        }
        this.logger.log(`Stale-correction nudge done: ${nudged} nudged`);
    }
}
