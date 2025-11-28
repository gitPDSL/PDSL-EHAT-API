import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveStatusEntity } from 'src/database/postgres/entities/leave-status.entity';
import { Repository } from 'typeorm';
import { UpdateLeaveStatusDto } from '../dto/leave-status.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class LeaveStatusService {
    constructor(
        @InjectRepository(LeaveStatusEntity) private readonly leaveStatusRepository: Repository<LeaveStatusEntity>
    ) {
    }
    async create(leaveStatusData: Partial<LeaveStatusEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                leaveStatusData['createdBy'] = currentUser;
            }
            const leaveStatus = await this.leaveStatusRepository.save(await this.leaveStatusRepository.create(leaveStatusData))
            return leaveStatus;
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
    async update(id: string, leaveStatusData: Partial<UpdateLeaveStatusDto>, currentUser: UserEntity | null = null) {
        try {
            let leaveStatus = await this.leaveStatusRepository.findOne({ where: { id } }) || {};
            Object.keys(leaveStatusData).map(key => {
                leaveStatus[key] = leaveStatusData[key];
            });
            if (currentUser && currentUser.id) {
                leaveStatus['updatedBy'] = currentUser;
            }
            await this.leaveStatusRepository.save(leaveStatus);
            // console.log('update leaveStatus', leaveStatus)
            return leaveStatus;
        } catch (error) {
            console.log('error-----', error, leaveStatusData)
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
            const leaveStatuss = page ? await this.leaveStatusRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select:select?._value||select }) : await this.leaveStatusRepository.find({ where: filter, relations: relations || [], select:select?._value||select });
            return leaveStatuss;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const leaveStatus = await this.leaveStatusRepository.findOne({ where: { id }, relations });
            return leaveStatus;
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
            const leaveStatus = await this.leaveStatusRepository.findOne({ where: filter, relations: relations || [] });
            return leaveStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const leaveStatus = await this.leaveStatusRepository.delete(id);
            return leaveStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
