import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { Not, Repository } from 'typeorm';
import { UpdateTimesheetDto } from '../dto/timesheet.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateTimesheetDto } from '../dto/timesheet.dto';

@Injectable()
export class TimesheetService {
    constructor(
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>
    ) {
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
            // console.log(timesheetData)
            const timesheet = await this.timesheetRepository.save(await this.timesheetRepository.create(timesheetData))
            return timesheet;
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

            let timesheet = await this.timesheetRepository.findOne({ where: { id } }) || {};
            Object.keys(timesheetData).map(key => {
                timesheet[key] = timesheetData[key];
            })
            await this.timesheetRepository.save(timesheet);
            // console.log('update timesheet', timesheet)
            return timesheet;
        } catch (error) {
            console.log('error-----', error, timesheetData)
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
            const timesheets = await this.timesheetRepository.find({ where: query });
            // console.log('====================', timesheets)
            if (!timesheets) throw new NotFoundException('No user found matching the query.');
            let timesheetList: any = [];
            if (currentUser && currentUser.id) {
                timesheetData['updatedBy'] = currentUser;
            }
            if (timesheetData.status)
                timesheetData.status = { id: timesheetData.status };
            if (timesheetData.approvedBy)
                timesheetData.approvedBy = { id: timesheetData.approvedBy };
            for (let timesheet of timesheets) {
                Object.assign(timesheet, {
                    ...timesheetData,
                    updatedBy: currentUser,
                });
                // console.log(user)
                timesheet = await this.timesheetRepository.save(timesheet);
                timesheetList.push(timesheet);
            }
            return timesheetList;
        } catch (err) {
            console.log('--=--==-', err);
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
