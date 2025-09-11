import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';
import { Repository } from 'typeorm';
import { UpdateProjectUserDto } from '../dto/project-user.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateProjectDto } from 'src/modules/projects/dto/project.dto';

@Injectable()
export class ProjectUserService {
    constructor(
        @InjectRepository(ProjectUserEntity) private readonly projectUserRepository: Repository<ProjectUserEntity>
    ) {
    }
    async create(data: Partial<CreateProjectDto>, currentUser: UserEntity | null = null) {
        try {
            const projectUserData: any = data;
            if (currentUser && currentUser.id) {
                projectUserData['updatedBy'] = currentUser;
            }
            if (projectUserData.projectId)
                projectUserData.projectId = { id: projectUserData.projectId };
            if (projectUserData.userId)
                projectUserData.userId = { id: projectUserData.userId };

            const projectUser = await this.projectUserRepository.save(await this.projectUserRepository.create(projectUserData))
            return projectUser;
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
    async update(projectId: string, userId: string, data: Partial<UpdateProjectUserDto>, currentUser: UserEntity | null = null) {
        try {
            const projectUserData: any = data;
            if (projectUserData.projectId)
                projectUserData.projectId = { id: projectUserData.projectId };
            if (projectUserData.userId)
                projectUserData.userId = { id: projectUserData.userId };
            let projectUser = await this.projectUserRepository.findOne({ where: { projectId, userId } }) || {};
            Object.keys(projectUserData).map(key => {
                projectUser[key] = projectUserData[key];
            });
            if (currentUser && currentUser.id) {
                projectUser['updatedBy'] = currentUser;
            }
            await this.projectUserRepository.save(projectUser);
            // console.log('update projectUser', projectUser)
            return projectUser;
        } catch (error) {
            console.log('error-----', error, data)
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: any = {}) {
        try {
            const projectUsers = await this.projectUserRepository.find(query);
            return projectUsers;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(projectId: string, userId: string) {
        try {
            const projectUser = await this.projectUserRepository.findOneBy({ projectId, userId });
            return projectUser;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const projectUser = await this.projectUserRepository.findOne({ where: query });
            return projectUser;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(projectId: string, userId: string,) {
        try {
            const projectUser = await this.findOne(projectId, userId);
            if (projectUser)
                return this.projectUserRepository.remove(projectUser);
            else
                return new BadRequestException('No data found');
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
