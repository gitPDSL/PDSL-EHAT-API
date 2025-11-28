import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaveTypeEntity } from 'src/database/postgres/entities/leave-type.entity';
import { Repository } from 'typeorm';
import { UpdateLeaveTypeDto } from '../dto/leave-type.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class LeaveTypeService {
    constructor(
        @InjectRepository(LeaveTypeEntity) private readonly leaveTypeRepository: Repository<LeaveTypeEntity>
    ) {
    }
    async create(leaveTypeData: Partial<LeaveTypeEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                leaveTypeData['createdBy'] = currentUser;
            }
            const LeaveType = await this.leaveTypeRepository.save(await this.leaveTypeRepository.create(leaveTypeData))
            return LeaveType;
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
    async update(id: string, leaveTypeData: Partial<UpdateLeaveTypeDto>, currentUser: UserEntity | null = null) {
        try {
            let leaveType = await this.leaveTypeRepository.findOne({ where: { id } }) || {};
            Object.keys(leaveTypeData).map(key => {
                leaveType[key] = leaveTypeData[key];
            });
            if (currentUser && currentUser.id) {
                leaveType['updatedBy'] = currentUser;
            }
            await this.leaveTypeRepository.save(leaveType);
            // console.log('update leaveType', leaveType)
            return leaveType;
        } catch (error) {
            console.log('error-----', error, leaveTypeData)
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
            const leaveTypes = page ? await this.leaveTypeRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select:select?._value||select }) : await this.leaveTypeRepository.find({ where: filter, relations: relations || [], select:select?._value||select });
            return leaveTypes;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const leaveType = await this.leaveTypeRepository.findOne({ where: { id }, relations });
            return leaveType;
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
            const leaveType = await this.leaveTypeRepository.findOne({ where: filter, relations: relations || [] });
            return leaveType;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const leaveType = await this.leaveTypeRepository.delete(id);
            return leaveType;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
