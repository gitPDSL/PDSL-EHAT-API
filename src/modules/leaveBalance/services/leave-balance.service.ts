import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
import { Between, Not, Repository } from 'typeorm';
import { UpdateLeaveBalanceDto } from '../dto/leave-balance.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateLeaveBalanceDto } from '../dto/leave-balance.dto';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { LeaveTypeEntity } from 'src/database/postgres/entities/leave-type.entity';
import { AuditService } from 'src/modules/audit/audit.service';
import * as moment from 'moment';

@Injectable()
export class LeaveBalanceService {
    private readonly logger = new Logger(LeaveBalanceService.name);
    constructor(
        @InjectRepository(LeaveBalanceEntity) private readonly leaveBalanceRepository: Repository<LeaveBalanceEntity>,
        @InjectRepository(LeaveEntity) private readonly leaveRepository: Repository<LeaveEntity>,
        @InjectRepository(LeaveTypeEntity) private readonly leaveTypeRepository: Repository<LeaveTypeEntity>,
        private readonly auditService: AuditService,
    ) {
    }

    async provisionForUser(userId: string, year: number = new Date().getFullYear()): Promise<number> {
        const types = await this.leaveTypeRepository.find();
        let created = 0;
        for (const type of types) {
            const existing = await this.leaveBalanceRepository.findOne({
                where: { userId, leaveTypeId: type.id, year },
            });
            if (existing) continue;
            await this.leaveBalanceRepository.save(this.leaveBalanceRepository.create({
                userId,
                leaveTypeId: type.id,
                year,
                totalLeaves: type.defaultEntitlement,
                leavesUsed: 0,
                perMonthLeaveUsed: 0,
                disableMonths: '',
            } as any));
            created++;
        }
        return created;
    }
    async create(data: Partial<CreateLeaveBalanceDto>, currentUser: UserEntity | null = null) {
        try {
            const leaveBalanceData: any = data;
            if (currentUser && currentUser.id) {
                leaveBalanceData['createdBy'] = currentUser;
            }
            if (leaveBalanceData.status)
                leaveBalanceData.status = { id: leaveBalanceData.status };
            const leaveBalance = await this.leaveBalanceRepository.save(await this.leaveBalanceRepository.create(leaveBalanceData))
            return leaveBalance;
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
    async update(user: string, leaveType: string, year: number, data: Partial<UpdateLeaveBalanceDto>, currentUser: UserEntity | null = null) {
        const leaveBalanceData: any = data;
        const reason: string | undefined = (data as any)?.adjustmentReason;
        delete (leaveBalanceData as any).adjustmentReason;
        if (currentUser && currentUser.id) {
            leaveBalanceData['updatedBy'] = currentUser;
        }
        if (leaveBalanceData.status)
            leaveBalanceData.status = { id: leaveBalanceData.status };
        try {
            let leaveBalance: any = await this.leaveBalanceRepository.findOne({ where: { userId: user, leaveTypeId: leaveType, year } }) || {};
            const before = {
                totalLeaves: leaveBalance.totalLeaves,
                leavesUsed: leaveBalance.leavesUsed,
                accruedThisYear: leaveBalance.accruedThisYear,
                carryForward: leaveBalance.carryForward,
            };
            Object.keys(leaveBalanceData).map(key => {
                leaveBalance[key] = leaveBalanceData[key];
            })
            await this.leaveBalanceRepository.save(leaveBalance);
            const after = {
                totalLeaves: leaveBalance.totalLeaves,
                leavesUsed: leaveBalance.leavesUsed,
                accruedThisYear: leaveBalance.accruedThisYear,
                carryForward: leaveBalance.carryForward,
            };
            try {
                await this.auditService.log({
                    actorId: currentUser?.id ?? null,
                    action: 'leave.balance.manual.adjust',
                    entityType: 'LeaveBalance',
                    entityId: `${user}:${leaveType}:${year}`,
                    before,
                    after: { ...after, reason: reason ?? null },
                });
            } catch (error: any) {
                this.logger.warn(`Audit log failed on leave-balance update: ${error?.message ?? error}`);
            }
            return leaveBalance;
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
            if (filter.manager)
                filter.manager = { id: filter.manager };
            const leaveBalances = page ? await this.leaveBalanceRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select: select?._value || select }) : await this.leaveBalanceRepository.find({ where: filter, relations: relations || [], select: select?._value || select });

            return await Promise.all(leaveBalances.map(async (lb: any) => {
                const date1: any = moment().year(lb.year).startOf('year');
                const date2: any = moment().year(lb.year).endOf('year');
                const leaveUsed = await this.leaveRepository.countBy({ user: { id: lb.userId }, leaveType: { id: lb.leaveTypeId }, startDate: Between(new Date(date1), new Date(date2)), endDate: Between(new Date(date1), new Date(date2)), status: { id: 'APPROVED' } });
                lb.leaveUsed = leaveUsed;
                return lb;
            }));
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(user: string, leaveType: string, year: number, relations: string[] = []) {
        try {
            const leaveBalance: any = await this.leaveBalanceRepository.findOne({ where: { userId: user, leaveTypeId: leaveType, year }, relations });
            const date1: any = moment().year(leaveBalance.year).startOf('year');
            const date2: any = moment().year(leaveBalance.year).endOf('year');
            const leaveUsed = await this.leaveRepository.countBy({ user: { id: leaveBalance.userId }, leaveType: { id: leaveBalance.leaveTypeId }, startDate: Between(new Date(date1), new Date(date2)), endDate: Between(new Date(date1), new Date(date2)), status: { id: Not('APPROVED') } });
            leaveBalance.leaveUsed = leaveUsed;
            return leaveBalance;
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
            const leaveBalance: any = await this.leaveBalanceRepository.findOne({ where: filter, relations: relations || [] });
            const date1: any = moment().year(leaveBalance.year).startOf('year');
            const date2: any = moment().year(leaveBalance.year).endOf('year');
            const leaveUsed = await this.leaveRepository.countBy({ user: { id: leaveBalance.userId }, leaveType: { id: leaveBalance.leaveTypeId }, startDate: Between(new Date(date1), new Date(date2)), endDate: Between(new Date(date1), new Date(date2)), status: { id: 'APPROVED' } });
            leaveBalance.leaveUsed = leaveUsed;
            return leaveBalance;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(user: string, leaveType: string, year: number) {
        try {
            const leaveBalance = await this.leaveBalanceRepository.delete({ userId: user, leaveTypeId: leaveType, year });
            return leaveBalance;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
