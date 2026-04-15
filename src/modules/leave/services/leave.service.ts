import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { Repository } from 'typeorm';
import { UpdateLeaveDto } from '../dto/leave.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateLeaveDto } from '../dto/leave.dto';
import { AuditService } from 'src/modules/audit/audit.service';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class LeaveService {
    private readonly logger = new Logger(LeaveService.name);
    constructor(
        @InjectRepository(LeaveEntity) private readonly leaveRepository: Repository<LeaveEntity>,
        private readonly auditService: AuditService,
        private readonly mailService: MailService,
        private readonly notificationsService: NotificationsService,
    ) {
    }

    private formatDate(d: Date | string): string {
        try {
            const dt = typeof d === 'string' ? new Date(d) : d;
            return dt.toISOString().slice(0, 10);
        } catch {
            return String(d);
        }
    }

    private async dispatchSubmittedNotification(leaveId: string, actor: any): Promise<void> {
        try {
            const leave: any = await this.leaveRepository.findOne({
                where: { id: leaveId },
                relations: ['user', 'user.manager', 'leaveType'],
            });
            if (!leave?.user?.manager?.email) return;
            const webUrl = process.env.APP_URL ?? '';
            const managerName = leave.user.manager.fullName ?? 'there';
            const employeeName = leave.user.fullName ?? 'An employee';
            const leaveTypeName = leave.leaveType?.name ?? 'leave';
            const startDate = this.formatDate(leave.startDate);
            const endDate = this.formatDate(leave.endDate);
            const link = `${webUrl}/manage-leaves`;
            await this.mailService.sendLeaveSubmitted(
                leave.user.manager.email,
                managerName,
                employeeName,
                leaveTypeName,
                startDate,
                endDate,
                link,
            );
            await this.notificationsService.create({
                userId: leave.user.manager.id,
                type: 'leave.submitted',
                title: 'Leave request awaiting approval',
                body: `${employeeName} requested ${leaveTypeName} from ${startDate} to ${endDate}.`,
                metadata: { leaveId, employeeId: leave.user.id, link },
            });
        } catch (error) {
            this.logger.error(
                `Failed to dispatch leave.submitted notification for ${leaveId}: ${error?.message ?? error}`,
                error?.stack,
            );
        }
    }

    private async dispatchStatusNotification(leaveId: string, newStatusId: string, actor: any): Promise<void> {
        try {
            const leave: any = await this.leaveRepository.findOne({
                where: { id: leaveId },
                relations: ['user', 'leaveType'],
            });
            if (!leave?.user?.email) return;
            const employeeName = leave.user.fullName ?? 'there';
            const leaveTypeName = leave.leaveType?.name ?? 'leave';
            const startDate = this.formatDate(leave.startDate);
            const endDate = this.formatDate(leave.endDate);
            if (newStatusId === 'APPROVED') {
                await this.mailService.sendLeaveApproved(
                    leave.user.email,
                    employeeName,
                    leaveTypeName,
                    startDate,
                    endDate,
                );
                await this.notificationsService.create({
                    userId: leave.user.id,
                    type: 'leave.approved',
                    title: 'Leave approved',
                    body: `Your ${leaveTypeName} from ${startDate} to ${endDate} was approved.`,
                    metadata: { leaveId },
                });
            } else if (newStatusId === 'REJECTED') {
                const reason = leave.reason ?? null;
                await this.mailService.sendLeaveRejected(
                    leave.user.email,
                    employeeName,
                    leaveTypeName,
                    startDate,
                    endDate,
                    reason,
                );
                await this.notificationsService.create({
                    userId: leave.user.id,
                    type: 'leave.rejected',
                    title: 'Leave rejected',
                    body: `Your ${leaveTypeName} from ${startDate} to ${endDate} was rejected.${reason ? ' Reason: ' + reason : ''}`,
                    metadata: { leaveId, reason },
                });
            }
        } catch (error) {
            this.logger.error(
                `Failed to dispatch leave status notification for ${leaveId} status=${newStatusId}: ${error?.message ?? error}`,
                error?.stack,
            );
        }
    }
    async create(data: Partial<CreateLeaveDto>, currentUser: UserEntity | null = null) {
        try {
            const leaveData: any = data;
            if (currentUser && currentUser.id) {
                leaveData['createdBy'] = currentUser;
            }
            if (leaveData.user)
                leaveData.user = { id: leaveData.user };
            if (leaveData.leaveType)
                leaveData.leaveType = { id: leaveData.leaveType };
            if (leaveData.status)
                leaveData.status = { id: leaveData.status };
            if (leaveData.approvedBy)
                leaveData.approvedBy = { id: leaveData.approvedBy };
            const leave = await this.leaveRepository.save(await this.leaveRepository.create(leaveData))
            if ((leave as any)?.id) {
                await this.dispatchSubmittedNotification((leave as any).id, currentUser);
            }
            return leave;
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
    async update(id: string, data: Partial<UpdateLeaveDto>, currentUser: UserEntity | null = null) {
        const leaveData: any = data;
        if (currentUser && currentUser.id) {
            leaveData['updatedBy'] = currentUser;
        }
        if (leaveData.user)
            leaveData.user = { id: leaveData.user };
        if (leaveData.leaveType)
            leaveData.leaveType = { id: leaveData.leaveType };
        if (leaveData.status)
            leaveData.status = { id: leaveData.status };
        if (leaveData.approvedBy)
            leaveData.approvedBy = { id: leaveData.approvedBy };
        try {
            let leave: any = await this.leaveRepository.findOne({ where: { id }, relations: ['status'] }) || {};
            const prevStatusId: string | null = leave?.status?.id ?? null;
            Object.keys(leaveData).map(key => {
                leave[key] = leaveData[key];
            })
            await this.leaveRepository.save(leave);
            const nextStatusId: string | null = leave?.status?.id ?? null;
            if (leaveData.status && prevStatusId !== nextStatusId) {
                await this.auditService.log({
                    actorId: currentUser?.id ?? null,
                    action: 'leave.status.change',
                    entityType: 'Leave',
                    entityId: id,
                    before: { status: prevStatusId },
                    after: { status: nextStatusId },
                });
                if (nextStatusId === 'APPROVED' || nextStatusId === 'REJECTED') {
                    await this.dispatchStatusNotification(id, nextStatusId, currentUser);
                }
            }
            return leave;
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: Record<string, any> = {}) {
        try {
            const { page, limit, sortBy, order, relations, select, ...filter } = query;
            const sortOrder = {};
            if (sortBy)
                sortOrder[sortBy] = order;
            // console.log('filter-----', filter)
            if (filter.user)
                filter.user = { id: filter.user };
            if (filter.leaveType)
                filter.leaveType = { id: filter.leaveType };
            if (filter.status)
                filter.status = { id: filter.status };
            if (filter.approvedBy)
                filter.approvedBy = { id: filter.approvedBy };
            const leaves = page ? await this.leaveRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select: select?._value || select }) : await this.leaveRepository.find({ where: filter, relations: relations || [], select: select?._value || select });
            return leaves;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const leave = await this.leaveRepository.findOne({ where: { id }, relations });
            return leave;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Record<string, any>) {
        try {
            const { relations, ...filter } = query;
            if (filter.user)
                filter.user = { id: filter.user };
            if (filter.leaveType)
                filter.leaveType = { id: filter.leaveType };
            if (filter.status)
                filter.status = { id: filter.status };
            if (filter.approvedBy)
                filter.approvedBy = { id: filter.approvedBy };
            const leave = await this.leaveRepository.findOne({ where: filter, relations: relations || [] });
            return leave;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const leave = await this.leaveRepository.delete(id);
            return leave;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
