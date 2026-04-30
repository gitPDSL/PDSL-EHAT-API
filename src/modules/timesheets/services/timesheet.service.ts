import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { Between, DataSource, Not, Repository } from 'typeorm';
import * as moment from 'moment';
import { UpdateTimesheetDto } from '../dto/timesheet.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateTimesheetDto } from '../dto/timesheet.dto';
import { AuditService } from 'src/modules/audit/audit.service';
import { PayrollService } from 'src/modules/payroll/services/payroll.service';
import { ProjectCapacityService } from 'src/modules/projects/services/project-capacity.service';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class TimesheetService {
    private readonly logger = new Logger(TimesheetService.name);
    constructor(
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly auditService: AuditService,
        private readonly payrollService: PayrollService,
        private readonly projectCapacityService: ProjectCapacityService,
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService,
    ) {
    }

    private async dispatchStatusNotification(
        timesheetId: string,
        newStatusId: string,
        rejectionReason: string | null,
        actor: any,
    ): Promise<void> {
        try {
            const ts: any = await this.timesheetRepository.findOne({
                where: { id: timesheetId },
                relations: ['user', 'user.manager', 'project', 'project.manager'],
            });
            if (!ts) return;
            const webUrl = process.env.APP_URL ?? '';
            if (newStatusId === 'SUBMITTED') {
                const recipient = ts.project?.manager ?? ts.user?.manager;
                if (!recipient?.email) return;
                const recipientName = recipient.fullName ?? 'there';
                const employeeName = ts.user?.fullName ?? 'An employee';
                const link = `${webUrl}/approvals`;
                await this.mailService.sendTimesheetSubmitted(
                    recipient.email,
                    recipientName,
                    employeeName,
                    ts.weekNumber,
                    ts.year,
                    link,
                );
                await this.notificationsService.create({
                    userId: recipient.id,
                    type: 'timesheet.submitted',
                    title: 'Timesheet awaiting approval',
                    body: `${employeeName} submitted a timesheet for week ${ts.weekNumber}.`,
                    metadata: { timesheetId, employeeId: ts.user?.id, link },
                });
            } else if (newStatusId === 'APPROVED') {
                if (!ts.user?.email) return;
                const approverName = actor?.fullName ?? 'your manager';
                await this.mailService.sendTimesheetApproved(
                    ts.user.email,
                    ts.user.fullName ?? 'there',
                    approverName,
                    ts.weekNumber,
                    ts.year,
                );
                await this.notificationsService.create({
                    userId: ts.user.id,
                    type: 'timesheet.approved',
                    title: `Week ${ts.weekNumber} approved`,
                    body: `Your timesheet for week ${ts.weekNumber} of ${ts.year} was approved.`,
                    metadata: { timesheetId, approverId: actor?.id },
                });
            } else if (newStatusId === 'REJECTED') {
                if (!ts.user?.email) return;
                const rejecterName = actor?.fullName ?? 'your manager';
                const link = `${webUrl}/hours`;
                await this.mailService.sendTimesheetRejected(
                    ts.user.email,
                    ts.user.fullName ?? 'there',
                    rejecterName,
                    ts.weekNumber,
                    ts.year,
                    rejectionReason ?? '',
                    link,
                );
                await this.notificationsService.create({
                    userId: ts.user.id,
                    type: 'timesheet.rejected',
                    title: `Week ${ts.weekNumber} rejected`,
                    body: `Your timesheet for week ${ts.weekNumber} of ${ts.year} was rejected.${rejectionReason ? ' Reason: ' + rejectionReason : ''}`,
                    metadata: { timesheetId, rejectionReason, link },
                });
            }
        } catch (error) {
            this.logger.error(
                `Failed to dispatch notification for timesheet ${timesheetId} status=${newStatusId}: ${error?.message ?? error}`,
                error?.stack,
            );
        }
    }

    private async assertNotInLockedPeriod(
        date: Date | string,
        currentUser: any,
        timesheetId?: string,
    ): Promise<void> {
        const locked = await this.payrollService.findLockedPeriodCovering(date);
        if (!locked) return;
        if (currentUser?.role?.id === 'ADMIN') {
            await this.auditService.log({
                actorId: currentUser?.id ?? null,
                action: 'payroll.lock.override',
                entityType: 'Timesheet',
                entityId: timesheetId ?? 'new',
                before: { lockedPeriodId: locked.id, periodStart: locked.startDate, periodEnd: locked.endDate },
                after: { override: true },
            });
            return;
        }
        throw new ForbiddenException(
            `Cannot modify a timesheet whose date falls in locked payroll period ${locked.startDate} to ${locked.endDate}`,
        );
    }
    private async assertDailyHoursCap(
        userId: string,
        date: Date | string,
        newHours: number,
        excludeId?: string,
    ) {
        const start = moment(date).startOf('day').toDate();
        const end = moment(date).endOf('day').toDate();
        const where: any = { userId, date: Between(start, end) };
        if (excludeId) where.id = Not(excludeId);
        const existing = await this.timesheetRepository.find({ where });
        const currentSum = existing.reduce((s, t) => s + Number(t.hours ?? 0), 0);
        const total = currentSum + Number(newHours);
        if (total > 24) {
            throw new BadRequestException(
                `Daily hours cap exceeded: user has ${currentSum}h on ${moment(date).format('YYYY-MM-DD')}, this entry would make it ${total}h (max 24).`,
            );
        }
    }
    async create(data: Partial<CreateTimesheetDto>, currentUser: UserEntity | null = null) {
        try {
            const timesheetData: any = data;
            if (currentUser && currentUser.id) {
                timesheetData['createdBy'] = currentUser;
            }
            if (timesheetData.status)
                timesheetData.status = { id: timesheetData.status };
            if (timesheetData.approvedBy)
                timesheetData.approvedBy = { id: timesheetData.approvedBy };
            if (timesheetData.userId && timesheetData.date && timesheetData.hours !== undefined) {
                await this.assertDailyHoursCap(
                    timesheetData.userId,
                    timesheetData.date,
                    Number(timesheetData.hours),
                );
            }
            if (timesheetData.date) {
                await this.assertNotInLockedPeriod(timesheetData.date, currentUser);
            }
            if (timesheetData.projectId && timesheetData.hours !== undefined) {
                await this.projectCapacityService.assertCapacity(
                    timesheetData.projectId,
                    Number(timesheetData.hours),
                );
            }
            const timesheet = await this.timesheetRepository.save(await this.timesheetRepository.create(timesheetData))
            return timesheet;
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async update(id: string, data: Partial<UpdateTimesheetDto>, currentUser: UserEntity | null = null) {
        const timesheetData: any = data;
        if (currentUser && currentUser.id) {
            timesheetData['updatedBy'] = currentUser;
        }
        if (timesheetData.status)
            timesheetData.status = { id: timesheetData.status };
        if (timesheetData.approvedBy)
            timesheetData.approvedBy = { id: timesheetData.approvedBy };
        try {

            let timesheet: any = await this.timesheetRepository.findOne({ where: { id }, relations: ['status'] }) || {};
            const prevStatusId = timesheet.status?.id ?? null;
            if (timesheetData.hours !== undefined && timesheet.userId && timesheet.date) {
                await this.assertDailyHoursCap(
                    timesheet.userId,
                    timesheet.date,
                    Number(timesheetData.hours),
                    id,
                );
            }
            if (timesheet.date) {
                await this.assertNotInLockedPeriod(timesheet.date, currentUser, id);
            }
            if (timesheetData.hours !== undefined && timesheet.projectId) {
                await this.projectCapacityService.assertCapacity(
                    timesheet.projectId,
                    Number(timesheetData.hours),
                    id,
                );
            }
            Object.keys(timesheetData).map(key => {
                timesheet[key] = timesheetData[key];
            })
            await this.timesheetRepository.save(timesheet);
            const newStatusId = timesheet.status?.id ?? null;
            if (timesheetData.status && prevStatusId !== newStatusId) {
                await this.auditService.log({
                    actorId: currentUser?.id ?? null,
                    action: 'timesheet.status.change',
                    entityType: 'Timesheet',
                    entityId: id,
                    before: { status: prevStatusId },
                    after: { status: newStatusId },
                });
                await this.dispatchStatusNotification(id, newStatusId, timesheet.rejectionReason ?? null, currentUser);
            }
            return timesheet;
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async bulkUpdate(
        query: Record<string, any> = {},
        data: Partial<UpdateTimesheetDto>,
        currentUser: UserEntity | any
    ): Promise<UserEntity[] | UserEntity> {
        if (!query || Object.keys(query).length === 0 || Array.isArray(query)) {
            throw new BadRequestException('Valid query object is required when no IDs are provided.');
        }
        const timesheetData: any = data;
        // console.log('-------------------', query, userData)
        try {
            const allTimesheets = await this.timesheetRepository.find({
                where: query,
                relations: ['user', 'user.manager', 'project', 'project.manager', 'status'],
            });
            // console.log('====================', allTimesheets)
            if (!allTimesheets) throw new NotFoundException('No user found matching the query.');
            let timesheets = allTimesheets;
            if (currentUser?.role?.id !== 'ADMIN') {
                timesheets = allTimesheets.filter((ts: any) => {
                    const projMgr = ts.project?.manager?.id;
                    const lineMgr = ts.user?.manager?.id;
                    return currentUser?.id === projMgr || currentUser?.id === lineMgr;
                });
            }
            if (currentUser && currentUser.id) {
                timesheetData['updatedBy'] = currentUser;
            }
            if (timesheetData.status)
                timesheetData.status = { id: timesheetData.status };
            if (timesheetData.approvedBy)
                timesheetData.approvedBy = { id: timesheetData.approvedBy };
            const prevStatusByTimesheetId = new Map<string, string | null>();
            for (const ts of timesheets) {
                prevStatusByTimesheetId.set(ts.id, (ts as any).status?.id ?? null);
                if ((ts as any).date) {
                    await this.assertNotInLockedPeriod((ts as any).date, currentUser, ts.id);
                }
            }
            const timesheetList = await this.dataSource.transaction(async (manager) => {
                const saved: any[] = [];
                for (let timesheet of timesheets) {
                    Object.assign(timesheet, {
                        ...timesheetData,
                        updatedBy: currentUser,
                    });
                    timesheet = await manager.save(timesheet);
                    saved.push(timesheet);
                }
                return saved;
            });
            if (timesheetData.status) {
                for (const ts of timesheetList) {
                    const prev = prevStatusByTimesheetId.get(ts.id) ?? null;
                    const next = (ts as any).status?.id ?? null;
                    if (prev !== next) {
                        await this.auditService.log({
                            actorId: currentUser?.id ?? null,
                            action: 'timesheet.status.change',
                            entityType: 'Timesheet',
                            entityId: ts.id,
                            before: { status: prev },
                            after: { status: next },
                        });
                        await this.dispatchStatusNotification(
                            ts.id,
                            next,
                            (ts as any).rejectionReason ?? timesheetData.rejectionReason ?? null,
                            currentUser,
                        );
                    }
                }
            }
            return timesheetList;
        } catch (err) {
            this.logger.error(err?.message ?? String(err), err?.stack);
            return []
        }
    }
    async findAll(query: Record<string, any> = {}) {
        try {
            const { page, limit, sortBy, order, relations, select, $or, ...filter } = query;
            const sortOrder = {};
            if (sortBy)
                sortOrder[sortBy] = order;
            if (filter.status) {
                filter.status = filter.status.includes('!') ? { id: Not(filter.status.replace('!', '')) } : { id: filter.status };
            }
            if (filter['project.status']) {
                filter['project'] = { status: { id: filter['project.status'] } };
                delete filter['project.status'];
            }
            if (filter['project.manager']) {
                filter['project'] = { manager: { id: filter['project.manager'] } };
                delete filter['project.manager'];
            }
            let timesheets: any = page ? await this.timesheetRepository.find({ where: [filter, $or || {}], order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select: select?._value || select, }) : await this.timesheetRepository.find({ where: [filter, $or || {}], relations: relations || [], select: select?._value || select });
            return timesheets.map(entity => {
                const project = entity.__project__;
                const user = entity.__user__;
                delete entity.__project__;
                delete entity.__user__;
                return {
                    ...entity,
                    ...(project ? { project } : {}),
                    ...(user ? { user } : {}),
                };
            });
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const timesheet = await this.timesheetRepository.findOne({ where: { id }, relations: relations });
            return timesheet;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Record<string, any>, selectFields: string = '') {
        try {
            const { relations, ...filter } = query;
            const timesheet = await this.timesheetRepository.findOne({ where: filter, relations: relations || [] });
            return timesheet;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const timesheet = await this.timesheetRepository.delete(id);
            return timesheet;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async removeMany(query: Record<string, any>) {
        try {
            const timesheet = await this.timesheetRepository.delete(query);
            return timesheet;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
