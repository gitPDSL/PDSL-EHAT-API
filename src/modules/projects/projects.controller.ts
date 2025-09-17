import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { Request } from 'express';
import { CreateProjectDto, PartialCreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { ProjectUserService } from '../projectUsers/services/project-user.service';
// @Controller({ path: 'projects', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('projects')
export class ProjectsController {
    constructor(
        private projectService: ProjectService,
        private projectUserService: ProjectUserService
    ) { }
    @ApiOperation({ summary: 'Create a new project' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectDto })
    @ApiResponseWrapper(ProjectEntity)
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
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.projectService.findAll(query);
    }
    @ApiOperation({ summary: 'Get project' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectEntity)
    @Get(':id')
    get(@Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.projectService.findById(id);
    }

    @ApiOperation({ summary: 'Update project' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectDto })
    @ApiResponseWrapper(ProjectEntity)
    @Put(':id')
    async update(@Req() req: Request, @Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string, @Body() updateProjectDto: UpdateProjectDto, @Ip() ip: string): Promise<any> {
        if (id && query.removeProjectUser)
            // remove department from all user
            try {
                await this.projectUserService.removeMany({ projectId: id });
            } catch (er) {
                console.error('-=-===-==--===-----', er)
            }
        return this.projectService.update(id, updateProjectDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete project' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.projectService.remove(id);
    }
}
