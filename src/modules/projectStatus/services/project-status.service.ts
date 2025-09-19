import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectStatusEntity } from 'src/database/postgres/entities/project-status.entity';
import { Repository } from 'typeorm';
import { UpdateProjectStatusDto } from '../dto/project-status.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class ProjectStatusService {
    constructor(
        @InjectRepository(ProjectStatusEntity) private readonly projectStatusRepository: Repository<ProjectStatusEntity>
    ) {
    }
    async create(projectStatusData: Partial<ProjectStatusEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                projectStatusData['updatedBy'] = currentUser;
            }
            const ProjectStatus = await this.projectStatusRepository.save(await this.projectStatusRepository.create(projectStatusData))
            return ProjectStatus;
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
    async update(id: string, projectStatusData: Partial<UpdateProjectStatusDto>, currentUser: UserEntity | null = null) {
        try {
            let ProjectStatus = await this.projectStatusRepository.findOne({ where: { id } }) || {};
            Object.keys(projectStatusData).map(key => {
                ProjectStatus[key] = projectStatusData[key];
            });
            if (currentUser && currentUser.id) {
                ProjectStatus['updatedBy'] = currentUser;
            }
            await this.projectStatusRepository.save(ProjectStatus);
            // console.log('update ProjectStatus', ProjectStatus)
            return ProjectStatus;
        } catch (error) {
            console.log('error-----', error, projectStatusData)
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
            const projectStatuses = page ? await this.projectStatusRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select:select?._value||select }) : await this.projectStatusRepository.find({ where: filter, relations: relations || [], select:select?._value||select });
            return projectStatuses;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const projectStatus = await this.projectStatusRepository.findOne({ where: { id }, relations });
            return projectStatus;
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
            const projectStatus = await this.projectStatusRepository.findOne({ where: filter, relations: relations || [] });
            return projectStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const projectStatus = await this.projectStatusRepository.delete(id);
            return projectStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
