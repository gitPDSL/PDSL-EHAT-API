import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
import { AuditLogEntity } from 'src/database/postgres/entities/audit-log.entity';

export interface RangeParams {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
}

@Injectable()
export class ExportsService {
    private readonly logger = new Logger(ExportsService.name);

    constructor(
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
        @InjectRepository(LeaveEntity) private readonly leaveRepository: Repository<LeaveEntity>,
        @InjectRepository(LeaveBalanceEntity) private readonly balanceRepository: Repository<LeaveBalanceEntity>,
        @InjectRepository(AuditLogEntity) private readonly auditRepository: Repository<AuditLogEntity>,
    ) { }

    private parseRange(p: RangeParams): { start: Date; end: Date; filename: string } {
        if (!p?.from || !p?.to) throw new BadRequestException('from and to are required (YYYY-MM-DD)');
        const start = moment(p.from).startOf('day').toDate();
        const end = moment(p.to).endOf('day').toDate();
        if (start > end) throw new BadRequestException('from must be on or before to');
        const filename = `${p.from}_to_${p.to}`;
        return { start, end, filename };
    }

    private buildWorkbook(sheetName: string, header: string[], rows: any[][]): Buffer {
        const wb = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
        XLSX.utils.book_append_sheet(wb, sheet, sheetName);
        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    }

    /** Hours by project: rolled up per (project, user, status). Useful for handing off to the invoicing team. */
    async hoursByProject(p: RangeParams): Promise<{ buffer: Buffer; filename: string }> {
        const { start, end, filename } = this.parseRange(p);
        const timesheets = await this.timesheetRepository.find({
            where: { date: Between(start, end) } as any,
            relations: ['user', 'project', 'project.client', 'status'],
        });

        const buckets = new Map<string, {
            project: string; client: string; user: string; statusId: string;
            hours: number; entries: number;
        }>();
        for (const ts of timesheets) {
            const t: any = ts;
            const projectName = t.project?.name ?? '-';
            const clientName = t.project?.client?.name ?? '-';
            const userName = t.user?.fullName ?? t.user?.email ?? '-';
            const statusId = t.status?.id ?? 'PENDING';
            const key = `${projectName}|${clientName}|${userName}|${statusId}`;
            const existing = buckets.get(key);
            if (existing) {
                existing.hours += Number(t.hours ?? 0);
                existing.entries += 1;
            } else {
                buckets.set(key, {
                    project: projectName, client: clientName, user: userName, statusId,
                    hours: Number(t.hours ?? 0), entries: 1,
                });
            }
        }

        const rows = Array.from(buckets.values())
            .sort((a, b) => a.project.localeCompare(b.project) || a.user.localeCompare(b.user))
            .map((r) => [r.project, r.client, r.user, r.statusId, Math.round(r.hours * 100) / 100, r.entries]);

        const totalHours = rows.reduce((s, r) => s + Number(r[4] || 0), 0);
        rows.push([], ['', '', '', 'Total hours', Math.round(totalHours * 100) / 100, '']);

        const buffer = this.buildWorkbook(
            'Hours by project',
            ['Project', 'Client', 'Employee', 'Status', 'Hours', 'Entries'],
            rows,
        );
        return { buffer, filename: `hours-by-project_${filename}.xlsx` };
    }

    /** Hours by user: per-user totals split by status. Useful for HR + payroll handoff. */
    async hoursByUser(p: RangeParams): Promise<{ buffer: Buffer; filename: string }> {
        const { start, end, filename } = this.parseRange(p);
        const timesheets = await this.timesheetRepository.find({
            where: { date: Between(start, end) } as any,
            relations: ['user', 'status'],
        });

        const buckets = new Map<string, {
            user: string; email: string;
            approved: number; submitted: number; pending: number; rejected: number;
        }>();
        for (const ts of timesheets) {
            const t: any = ts;
            const userId = t.user?.id ?? '?';
            const userName = t.user?.fullName ?? '-';
            const email = t.user?.email ?? '-';
            const statusId = t.status?.id ?? 'PENDING';
            const hrs = Number(t.hours ?? 0);
            if (!buckets.has(userId)) {
                buckets.set(userId, { user: userName, email, approved: 0, submitted: 0, pending: 0, rejected: 0 });
            }
            const b = buckets.get(userId)!;
            if (statusId === 'APPROVED') b.approved += hrs;
            else if (statusId === 'SUBMITTED') b.submitted += hrs;
            else if (statusId === 'REJECTED') b.rejected += hrs;
            else b.pending += hrs;
        }

        const rows = Array.from(buckets.values())
            .sort((a, b) => a.user.localeCompare(b.user))
            .map((r) => [
                r.user, r.email,
                Math.round(r.approved * 100) / 100,
                Math.round(r.submitted * 100) / 100,
                Math.round(r.pending * 100) / 100,
                Math.round(r.rejected * 100) / 100,
                Math.round((r.approved + r.submitted + r.pending) * 100) / 100,
            ]);

        const buffer = this.buildWorkbook(
            'Hours by user',
            ['Employee', 'Email', 'Approved', 'Submitted', 'Pending', 'Rejected', 'Total (excl. rejected)'],
            rows,
        );
        return { buffer, filename: `hours-by-user_${filename}.xlsx` };
    }

    /** Approval audit: every timesheet status transition in the range. Compliance evidence. */
    async approvalAudit(p: RangeParams): Promise<{ buffer: Buffer; filename: string }> {
        const { start, end, filename } = this.parseRange(p);
        const entries = await this.auditRepository
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.actor', 'actor')
            .where('a.action IN (:...actions)', {
                actions: ['timesheet.status.change', 'timesheet.correction.approved', 'timesheet.correction.denied'],
            })
            .andWhere('a.created_at BETWEEN :s AND :e', { s: start, e: end })
            .orderBy('a.created_at', 'DESC')
            .getMany();

        const rows = entries.map((entry) => {
            const e: any = entry;
            const before = e.before?.status ?? '';
            const after = e.after?.status ?? '';
            return [
                moment(e.createdAt).format('YYYY-MM-DD HH:mm'),
                e.actor?.fullName ?? e.actor?.email ?? 'system',
                e.action,
                e.entityId,
                before,
                after,
            ];
        });

        const buffer = this.buildWorkbook(
            'Approval audit',
            ['Timestamp', 'Actor', 'Action', 'Timesheet ID', 'Before', 'After'],
            rows,
        );
        return { buffer, filename: `approval-audit_${filename}.xlsx` };
    }

    /** Leave summary: balances + days taken + remaining as of a date. */
    async leaveSummary(p: RangeParams): Promise<{ buffer: Buffer; filename: string }> {
        const { start, end, filename } = this.parseRange(p);
        const year = moment(end).year();

        const balances = await this.balanceRepository.find({
            where: { year },
            relations: ['user', 'leaveType'] as any,
        });

        const approvedLeaves = await this.leaveRepository
            .createQueryBuilder('l')
            .leftJoinAndSelect('l.user', 'u')
            .leftJoinAndSelect('l.leaveType', 'lt')
            .where('l.leave_status_id = :s', { s: 'APPROVED' })
            .andWhere('l.start_date BETWEEN :ls AND :le', { ls: start, le: end })
            .getMany();

        const taken = new Map<string, number>();
        for (const leave of approvedLeaves) {
            const l: any = leave;
            const days = Math.max(1, moment(l.endDate).diff(moment(l.startDate), 'days') + 1);
            const key = `${l.user?.id}|${l.leaveType?.id}`;
            taken.set(key, (taken.get(key) ?? 0) + days);
        }

        const rows = balances
            .map((bal: any) => {
                const userName = bal.user?.fullName ?? bal.user?.email ?? '-';
                const email = bal.user?.email ?? '-';
                const leaveType = bal.leaveType?.name ?? bal.leaveTypeId;
                const accrued = Number(bal.accruedThisYear ?? 0);
                const carry = Number(bal.carryForward ?? 0);
                const used = taken.get(`${bal.userId}|${bal.leaveTypeId}`) ?? Number(bal.leavesUsed ?? 0);
                const remaining = Math.max(0, accrued + carry - used);
                return [userName, email, leaveType, accrued, carry, used, remaining];
            })
            .sort((a: any, b: any) => String(a[0]).localeCompare(String(b[0])));

        const buffer = this.buildWorkbook(
            `Leave summary ${year}`,
            ['Employee', 'Email', 'Type', 'Accrued', 'Carry-forward', 'Taken', 'Remaining'],
            rows,
        );
        return { buffer, filename: `leave-summary_${filename}.xlsx` };
    }
}
