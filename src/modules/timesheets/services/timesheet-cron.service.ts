import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import * as moment from 'moment';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { UserEntity, ACCOUNT_STATUS } from 'src/database/postgres/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

const UK_TZ = 'Europe/London';

@Injectable()
export class TimesheetCronService {
    private readonly logger = new Logger(TimesheetCronService.name);

    constructor(
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly mailService: MailService,
        private readonly notifications: NotificationsService,
    ) { }

    // Friday 15:00 UK time
    @Cron('0 15 * * 5', { name: 'timesheet.weekly-reminder', timeZone: UK_TZ })
    async weeklyReminder(): Promise<void> {
        this.logger.log('Running weekly timesheet reminder');
        const now = moment();
        const weekNumber = now.isoWeek();
        const year = now.isoWeekYear();
        const startOfWeek = now.clone().startOf('isoWeek');

        const weekdays: Array<{ date: string; label: string }> = [];
        for (let i = 0; i < 5; i++) {
            const day = startOfWeek.clone().add(i, 'days');
            weekdays.push({ date: day.format('YYYY-MM-DD'), label: day.format('ddd MMM D') });
        }
        const weekdayDateSet = new Set(weekdays.map((w) => w.date));

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
}
