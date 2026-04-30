import { Body, Controller, Delete, Get, Ip, Logger, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { ProjectCapacityService } from './services/project-capacity.service';
import { Request } from 'express';
import { CreateProjectDto, PartialCreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { ProjectUserService } from '../projectUsers/services/project-user.service';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
import { Roles } from 'src/decorators/roles.decorator';
@Controller('projects')
export class ProjectsController {
    private readonly logger = new Logger(ProjectsController.name);
    constructor(
        private projectService: ProjectService,
        private projectUserService: ProjectUserService,
        private projectCapacityService: ProjectCapacityService,
    ) { }

    @ApiOperation({ summary: 'Capacity snapshot for one or many projects. Pass ?ids=uuid1,uuid2 to bulk-fetch.' })
    @ApiBearerAuth()
    @Get('capacity/snapshot')
    async capacity(@Query('ids') ids?: string): Promise<any> {
        const idList = (ids ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (idList.length === 0) return [];
        return this.projectCapacityService.snapshotMany(idList);
    }
    @ApiOperation({ summary: 'Create a new project (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectDto })
    @ApiResponseWrapper(ProjectEntity)
    @Roles('ADMIN')
    @Post()
    create(@Req() req: Request, @Body() createProjectDto: CreateProjectDto, @Ip() ip: string): Promise<any> {
        createProjectDto.createdBy = req['user'].id;
        return this.projectService.create(createProjectDto, req['user']);
    }
    @ApiOperation({ summary: 'Get projects' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.filter(a => a);
        return this.projectService.findAll(query);
    }
    @ApiOperation({ summary: 'Get project' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectEntity)
    @Get(':id')
    get(@Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.filter(a => a);
        return this.projectService.findById(id);
    }

    @ApiOperation({ summary: 'Update project (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectDto })
    @ApiResponseWrapper(ProjectEntity)
    @Roles('ADMIN')
    @Put(':id')
    async update(@Req() req: Request, @Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string, @Body() updateProjectDto: UpdateProjectDto, @Ip() ip: string): Promise<any> {
        if (id && query.removeProjectUser)
            // remove department from all user
            try {
                await this.projectUserService.removeMany({ projectId: id });
            } catch (er) {
                this.logger.error(er?.message ?? String(er), er?.stack);
            }
        return this.projectService.update(id, updateProjectDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete project (admin only)' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.projectService.remove(id);
    }
}
