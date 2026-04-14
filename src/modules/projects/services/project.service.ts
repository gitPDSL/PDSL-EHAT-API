import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { Repository } from 'typeorm';
import { UpdateProjectDto } from '../dto/project.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CreateProjectDto } from '../dto/project.dto';
import { AuditService } from 'src/modules/audit/audit.service';

@Injectable()
export class ProjectService {
    private readonly logger = new Logger(ProjectService.name);
    constructor(
        @InjectRepository(ProjectEntity) private readonly projectRepository: Repository<ProjectEntity>,
        private readonly auditService: AuditService,
    ) {
    }
    async create(data: Partial<CreateProjectDto>, currentUser: UserEntity | null = null) {
        try {
            const projectData: any = data;
            if (currentUser && currentUser.id) {
                projectData['createdBy'] = currentUser;
            }
            if (projectData.client)
                projectData.client = { id: projectData.client };
            if (projectData.manager)
                projectData.manager = { id: projectData.manager };
            if (projectData.status)
                projectData.status = { id: projectData.status };
            const project = await this.projectRepository.save(await this.projectRepository.create(projectData))
            return project;
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async update(id: string, data: Partial<UpdateProjectDto>, currentUser: UserEntity | null = null) {
        const projectData: any = data;
        if (currentUser && currentUser.id) {
            projectData['updatedBy'] = currentUser;
        }
        if (projectData.client)
            projectData.client = { id: projectData.client };
        if (projectData.manager)
            projectData.manager = { id: projectData.manager };
        if (projectData.status)
            projectData.status = { id: projectData.status };
        try {
            let project: any = await this.projectRepository.findOne({ where: { id }, relations: ['manager'] }) || {};
            const prevManagerId: string | null = project?.manager?.id ?? null;
            Object.keys(projectData).map(key => {
                project[key] = projectData[key];
            })
            await this.projectRepository.save(project);
            const nextManagerId: string | null = project?.manager?.id ?? null;
            if (projectData.manager && prevManagerId !== nextManagerId) {
                await this.auditService.log({
                    actorId: currentUser?.id ?? null,
                    action: 'project.manager.change',
                    entityType: 'Project',
                    entityId: id,
                    before: { manager: prevManagerId },
                    after: { manager: nextManagerId },
                });
            }
            return project;
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
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
            if (filter.manager)
                filter.manager = { id: filter.manager };
            const projects = page ? await this.projectRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select: select?._value || select }) : await this.projectRepository.find({ where: filter, relations: relations || [], select: select?._value || select });
            return projects;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const project = await this.projectRepository.findOne({ where: { id }, relations });
            return project;
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
            const project = await this.projectRepository.findOne({ where: filter, relations: relations || [] });
            return project;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const project = await this.projectRepository.delete(id);
            return project;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
