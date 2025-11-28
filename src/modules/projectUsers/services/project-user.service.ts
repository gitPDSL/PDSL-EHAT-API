import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
                projectUserData['createdBy'] = currentUser;
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
    async bulkUpdate(
        query: Record<string, any> = {},
        data: Partial<UpdateProjectUserDto>,
        currentUser: UserEntity | any
    ): Promise<UserEntity[] | UserEntity> {
        if (!query || Object.keys(query).length === 0 || Array.isArray(query)) {
            throw new BadRequestException('Valid query object is required when no IDs are provided.');
        }
        const projectUserData: any = data;
        // console.log('-------------------', query, projectUserData)
        try {
            const projectUsers = await this.projectUserRepository.find({ where: query });
            // console.log('====================', users)
            if (!projectUsers) throw new NotFoundException('No user found matching the query.');
            let projectUserList: any = [];

            for (let projectUser of projectUsers) {


                Object.assign(projectUser, {
                    ...projectUserData,
                    updatedBy: currentUser,
                });
                // console.log(user)
                projectUser = await this.projectUserRepository.save(projectUser);
                projectUserList.push(projectUser);
            }
            return projectUserList;
        } catch (err) {
            console.log('--=--==-', err);
            return []
        }
    }
    async findAll(query: Record<string, any> = {}) {
        try {
            const { page, limit, sortBy, order, relations, select, ...filter } = query;
            const sortOrder = {};
            if (sortBy)
                sortOrder[sortBy] = order;
            if (filter['project.status']) {
                filter['project'] = { status: { id: filter['project.status'] } };
                delete filter['project.status'];
            }
            let projectUsers: any = page ? await this.projectUserRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select: select?._value || select }) : await this.projectUserRepository.find({ where: filter, relations: relations || [], select: select?._value || select });
            return projectUsers.map(entity => {
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

    async findById(projectId: string, userId: string, relations: string[] = []) {
        try {
            const projectUser = await this.projectUserRepository.findOne({ where: { projectId, userId }, relations });
            return projectUser;
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
            const projectUser = await this.projectUserRepository.findOne({ where: filter, relations });
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
            const projectUser = await this.findById(projectId, userId);
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
    async removeMany(query: Record<string, any>) {
        try {
            const projectUser = await this.projectUserRepository.delete(query);
            return projectUser;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
}
