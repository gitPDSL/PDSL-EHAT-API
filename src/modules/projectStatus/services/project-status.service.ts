import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectStatusEntity } from 'src/database/postgres/entities/project-status.entity';
import { Repository } from 'typeorm';
import { UpdateProjectStatusDto } from '../dto/project-status.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class ProjectStatusService {
    constructor(
        @InjectRepository(ProjectStatusEntity) private readonly ProjectStatusRepository: Repository<ProjectStatusEntity>
    ) {
    }
    async create(projectStatusData: Partial<ProjectStatusEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                projectStatusData['updatedBy'] = currentUser;
            }
            const ProjectStatus = await this.ProjectStatusRepository.save(await this.ProjectStatusRepository.create(projectStatusData))
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
            let ProjectStatus = await this.ProjectStatusRepository.findOne({ where: { id } }) || {};
            Object.keys(projectStatusData).map(key => {
                ProjectStatus[key] = projectStatusData[key];
            });
            if (currentUser && currentUser.id) {
                ProjectStatus['updatedBy'] = currentUser;
            }
            await this.ProjectStatusRepository.save(ProjectStatus);
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
    async findAll(query: any = {}) {
        try {
            const ProjectStatuses = await this.ProjectStatusRepository.find(query);
            return ProjectStatuses;
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
            const ProjectStatus = await this.ProjectStatusRepository.findOneBy({ id });
            return ProjectStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const ProjectStatus = await this.ProjectStatusRepository.findOne({ where: query });
            return ProjectStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const ProjectStatus = await this.ProjectStatusRepository.delete(id);
            return ProjectStatus;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
