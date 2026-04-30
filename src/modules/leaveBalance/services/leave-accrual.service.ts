import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment';
import { ACCOUNT_STATUS, EMPLOYMENT_TYPE, UserEntity } from 'src/database/postgres/entities/user.entity';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
import { LeaveAccrualRuleEntity } from 'src/database/postgres/entities/leave-accrual-rule.entity';
import { AuditService } from 'src/modules/audit/audit.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { MailService } from 'src/mail/mail.service';

const UK_TZ = 'Europe/London';

/**
 * Monthly leave accrual + annual cap-and-forfeit.
 *
 * Monthly run (1st @ 06:00 UK):
 *   - For each ACTIVE user with employmentType=EMPLOYEE, look at every
 *     leave_accrual_rule.
 *   - Compute the month's accrual amount, scale by part-time ratio if
 *     applicable, and pro-rate if hireDate falls inside the current month.
 *   - Add to leave_balances.accrued_this_year, capped at the rule's cap_days.
 *   - Update last_accrual_at to the first of the current month so re-runs
 *     in the same month are no-ops (idempotent within a month).
 *
 * Annual run (1 Jan @ 00:30 UK):
 *   - For each (user, leave_type) balance, look up the rule.
 *   - carryForward = min(currentBalance, rule.carryForwardCap).
 *   - Provision the new year's balance row with carryForward as the floor.
 *   - Audit + notify the user when forfeit occurred.
 */
@Injectable()
export class LeaveAccrualService {
    private readonly logger = new Logger(LeaveAccrualService.name);

    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(LeaveBalanceEntity) private readonly balanceRepository: Repository<LeaveBalanceEntity>,
        @InjectRepository(LeaveAccrualRuleEntity) private readonly ruleRepository: Repository<LeaveAccrualRuleEntity>,
        private readonly auditService: AuditService,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) { }

    @Cron('0 6 1 * *', { name: 'leave.accrual.monthly', timeZone: UK_TZ })
    async runMonthlyAccrual(): Promise<void> {
        // Cron decorator pins the trigger time to UK; the body works in
        // local clock terms which is fine for a date-level decision.
        const today = moment();
        const year = today.year();
        const monthStart = today.clone().startOf('month').format('YYYY-MM-DD');
        this.logger.log(`Monthly leave accrual run for ${monthStart}`);

        const rules = await this.ruleRepository.find();
        if (rules.length === 0) {
            this.logger.log('No accrual rules configured; skipping run');
            return;
        }

        const users = await this.userRepository.find({
            where: { status: ACCOUNT_STATUS.ACTIVE, employmentType: EMPLOYMENT_TYPE.EMPLOYEE },
        });
        let totalAccrued = 0;
        let usersTouched = 0;
        for (const user of users) {
            try {
                const userTotal = await this.accrueForUser(user, rules, monthStart, year);
                if (userTotal > 0) {
                    usersTouched++;
                    totalAccrued += userTotal;
                }
            } catch (error: any) {
                this.logger.error(`Accrual failed for user ${user.id}: ${error?.message ?? error}`, error?.stack);
            }
        }
        this.logger.log(`Monthly accrual done: ${usersTouched} users, ${totalAccrued.toFixed(2)} days accrued`);
    }

    private async accrueForUser(
        user: UserEntity,
        rules: LeaveAccrualRuleEntity[],
        monthStart: string,
        year: number,
    ): Promise<number> {
        const partTime = (user.contractType ?? 'FULL_TIME').toUpperCase() === 'PART_TIME';
        const partTimeRatio = partTime
            ? Math.max(0, Math.min(1, Number(user.weeklyTargetHours ?? 40) / 40))
            : 1;
        const prorationRatio = this.firstMonthProration(user.hireDate, monthStart);

        let totalForUser = 0;
        for (const rule of rules) {
            if (partTime && !rule.appliesToPartTime) continue;
            if (!partTime && !rule.appliesToFullTime) continue;

            const balance = await this.getOrCreateBalance(user.id, rule.leaveTypeId, year);
            // Skip if we already accrued this month.
            if (balance.lastAccrualAt && balance.lastAccrualAt >= monthStart) continue;

            const baseAccrual = Number(rule.accrualPerMonth) * partTimeRatio * prorationRatio;
            if (baseAccrual <= 0) {
                balance.lastAccrualAt = monthStart;
                await this.balanceRepository.save(balance);
                continue;
            }
            const cap = Number(rule.capDays);
            const accrued = Number(balance.accruedThisYear ?? 0);
            const headroom = Math.max(0, cap - accrued);
            const applied = Math.min(baseAccrual, headroom);
            balance.accruedThisYear = (accrued + applied).toFixed(2) as any;
            balance.totalLeaves = Math.max(balance.totalLeaves, Math.ceil(accrued + applied + Number(balance.carryForward ?? 0)));
            balance.lastAccrualAt = monthStart;
            await this.balanceRepository.save(balance);

            if (applied > 0) {
                totalForUser += applied;
                await this.notifyAccrual(user, rule.leaveTypeId, applied, accrued + applied, cap);
            }
        }
        return totalForUser;
    }

    private firstMonthProration(hireDate: string | null, monthStart: string): number {
        if (!hireDate) return 1;
        const hire = String(hireDate).slice(0, 10);
        const monthEnd = moment(monthStart).endOf('month').format('YYYY-MM-DD');
        if (hire <= monthStart) return 1;          // hired before this month
        if (hire > monthEnd) return 0;             // hired after this month
        const totalDays = moment(monthEnd).date();
        const remainingDays = totalDays - moment(hire).date() + 1;
        return Math.max(0, Math.min(1, remainingDays / totalDays));
    }

    private async getOrCreateBalance(userId: string, leaveTypeId: string, year: number): Promise<LeaveBalanceEntity> {
        const existing = await this.balanceRepository.findOne({ where: { userId, leaveTypeId, year } });
        if (existing) return existing;
        const created = this.balanceRepository.create({
            userId,
            leaveTypeId,
            year,
            totalLeaves: 0,
            leavesUsed: 0,
            perMonthLeaveUsed: 0,
            disableMonths: '',
            accruedThisYear: '0',
            lastAccrualAt: null,
            carryForward: '0',
        } as any);
        return this.balanceRepository.save(created as any) as Promise<LeaveBalanceEntity>;
    }

    private async notifyAccrual(user: UserEntity, leaveTypeId: string, applied: number, newBalance: number, cap: number): Promise<void> {
        const link = `${process.env.APP_URL ?? ''}/my-leaves`;
        const title = `${applied.toFixed(2)} ${leaveTypeId.toLowerCase()} day${applied >= 1.5 || applied < 1 ? 's' : ''} accrued`;
        const body = `Your ${leaveTypeId.toLowerCase()} balance is now ${newBalance.toFixed(2)} of ${cap} days. ${newBalance >= cap * 0.9 ? 'Consider booking time off before you hit the cap.' : ''}`;
        try {
            await this.notificationsService.create({
                userId: user.id,
                type: 'leave.accrual',
                title,
                body,
                metadata: { leaveTypeId, applied, newBalance, cap, link },
            });
        } catch (error: any) {
            this.logger.warn(`Failed to notify ${user.id} about accrual: ${error?.message ?? error}`);
        }
        if (user.email) {
            try {
                await this.mailService.sendGeneric(
                    user.email,
                    title,
                    body,
                    { recipientName: user.fullName ?? 'there', link },
                );
            } catch (error: any) {
                this.logger.warn(`Failed to email ${user.email} about accrual: ${error?.message ?? error}`);
            }
        }
    }

    /**
     * Year-end carry-forward + forfeit. Run at 00:30 UK on Jan 1.
     * Copies eligible carry-forward into the next year's row, audits forfeit
     * amounts, and notifies users when their balance was clipped.
     */
    @Cron('30 0 1 1 *', { name: 'leave.accrual.year-end', timeZone: UK_TZ })
    async runYearEndForfeit(): Promise<void> {
        const newYear = new Date().getFullYear();
        const oldYear = newYear - 1;
        this.logger.log(`Year-end leave forfeit running: ${oldYear} -> ${newYear}`);
        const rules = await this.ruleRepository.find();
        const ruleByType = new Map(rules.map((r) => [r.leaveTypeId, r]));
        const oldBalances = await this.balanceRepository.find({ where: { year: oldYear } });
        let forfeitedDays = 0;
        let usersTouched = 0;
        for (const old of oldBalances) {
            try {
                const rule = ruleByType.get(old.leaveTypeId);
                const cap = rule ? Number(rule.carryForwardCap) : 0;
                const accrued = Number(old.accruedThisYear ?? 0);
                const used = Number(old.leavesUsed ?? 0);
                const remaining = Math.max(0, accrued - used);
                const carry = Math.min(remaining, cap);
                const forfeit = Math.max(0, remaining - cap);

                // The earlier 00:00 cron may have already created a fresh
                // new-year row via provisionForUser; in that case we just
                // need to set carryForward. Otherwise we insert it.
                let nextRow = await this.balanceRepository.findOne({
                    where: { userId: old.userId, leaveTypeId: old.leaveTypeId, year: newYear },
                });
                if (!nextRow) {
                    nextRow = this.balanceRepository.create({
                        userId: old.userId,
                        leaveTypeId: old.leaveTypeId,
                        year: newYear,
                        totalLeaves: rule ? Number(rule.capDays) : old.totalLeaves,
                        leavesUsed: 0,
                        perMonthLeaveUsed: 0,
                        disableMonths: '',
                        accruedThisYear: '0',
                        lastAccrualAt: null,
                        carryForward: '0',
                    } as Partial<LeaveBalanceEntity>) as LeaveBalanceEntity;
                }
                nextRow.carryForward = carry.toFixed(2) as any;
                await this.balanceRepository.save(nextRow);

                if (forfeit > 0) {
                    forfeitedDays += forfeit;
                    usersTouched++;
                    await this.auditService.log({
                        actorId: null,
                        action: 'leave.balance.forfeit',
                        entityType: 'LeaveBalance',
                        entityId: `${old.userId}:${old.leaveTypeId}:${old.year}`,
                        before: { accrued, used, carryCap: cap },
                        after: { carry, forfeit },
                    });
                    await this.notifyForfeit(old.userId, old.leaveTypeId, forfeit, carry);
                }
            } catch (error: any) {
                this.logger.error(`Forfeit failed for ${old.userId} ${old.leaveTypeId}: ${error?.message ?? error}`);
            }
        }
        this.logger.log(`Year-end done: ${forfeitedDays.toFixed(2)} days forfeited across ${usersTouched} users`);
    }

    private async notifyForfeit(userId: string, leaveTypeId: string, forfeit: number, carry: number): Promise<void> {
        const link = `${process.env.APP_URL ?? ''}/my-leaves`;
        const title = `${forfeit.toFixed(2)} unused ${leaveTypeId.toLowerCase()} days forfeited`;
        const body = `${carry.toFixed(2)} days carried forward to the new year; ${forfeit.toFixed(2)} day(s) over the carry-forward cap were forfeited.`;
        try {
            await this.notificationsService.create({
                userId,
                type: 'leave.forfeit',
                title,
                body,
                metadata: { leaveTypeId, forfeit, carry, link },
            });
        } catch (error: any) {
            this.logger.warn(`Forfeit notification failed for ${userId}: ${error?.message ?? error}`);
        }
    }
}
