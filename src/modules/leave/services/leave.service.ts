import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { Repository } from 'typeorm';
import { UpdateLeaveDto } from '../dto/leave.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateLeaveDto } from '../dto/leave.dto';

@Injectable()
export class LeaveService {
    constructor(
        @InjectRepository(LeaveEntity) private readonly leaveRepository: Repository<LeaveEntity>
    ) {
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
            return leave;
        } catch (error) {
            console.log(error);
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
            let leave = await this.leaveRepository.findOne({ where: { id } }) || {};
            Object.keys(leaveData).map(key => {
                leave[key] = leaveData[key];
            })
            await this.leaveRepository.save(leave);
            // console.log('update leave', leave)
            return leave;
        } catch (error) {
            console.log('error-----', error, leaveData)
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
