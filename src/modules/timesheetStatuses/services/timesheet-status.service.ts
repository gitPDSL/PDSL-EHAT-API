import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TimesheetStatusEntity } from 'src/database/postgres/entities/timesheet-status.entity';
import { Repository } from 'typeorm';
import { UpdateTimesheetStatusDto } from '../dto/update-timesheet-status.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class TimesheetStatusService {
    constructor(
        @InjectRepository(TimesheetStatusEntity) private readonly timesheetStatusRepository: Repository<TimesheetStatusEntity>
    ) {
    }
    async create(timesheetStatusData: Partial<TimesheetStatusEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                timesheetStatusData['updatedBy'] = currentUser;
            }
            const timesheetStatus = await this.timesheetStatusRepository.save(await this.timesheetStatusRepository.create(timesheetStatusData))
            return timesheetStatus;
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
    async update(id: string, timesheetStatusData: Partial<UpdateTimesheetStatusDto>, currentUser: UserEntity | null = null) {
        try {
            let timesheetStatus = await this.timesheetStatusRepository.findOne({ where: { id } }) || {};
            Object.keys(timesheetStatusData).map(key => {
                timesheetStatus[key] = timesheetStatusData[key];
            });
            if (currentUser && currentUser.id) {
                timesheetStatus['updatedBy'] = currentUser;
            }
            await this.timesheetStatusRepository.save(timesheetStatus);
            // console.log('update timesheetStatus', timesheetStatus)
            return timesheetStatus;
        } catch (error) {
            console.log('error-----', error, timesheetStatusData)
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: any = {}) {
        try {
            const timesheetStatuses = await this.timesheetStatusRepository.find(query);
            return timesheetStatuses;
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
            const timesheetStatus = await this.timesheetStatusRepository.findOneBy({ id });
            return timesheetStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const timesheetStatus = await this.timesheetStatusRepository.findOne({ where: query });
            return timesheetStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const timesheetStatus = await this.timesheetStatusRepository.delete(id);
            return timesheetStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
