import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { Repository } from 'typeorm';
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
                timesheetData['updatedBy'] = currentUser;
            }
            if (timesheetData.projectUser)
                timesheetData.projectUser = { id: timesheetData.projectUser };
            if (timesheetData.status)
                timesheetData.status = { id: timesheetData.status };
            if (timesheetData.approvedBy)
                timesheetData.approvedBy = { id: timesheetData.approvedBy };
            
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
    async update(id: string, timesheetData: Partial<UpdateTimesheetDto>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                timesheetData['updatedBy'] = currentUser;
            }
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
    async findAll(query: any = {}) {
        try {
            const timesheets = await this.timesheetRepository.find(query);
            return timesheets;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, refreshToken: boolean = false) {
        try {
            // let selectFields: string = 'firstName lastNeme email accountType status createdAt updatedAt' + (refreshToken ? ' refreshToken' : '');
            const timesheet = await this.timesheetRepository.findOneBy({ id });
            return timesheet;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const timesheet = await this.timesheetRepository.findOne({ where: query });
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

}
