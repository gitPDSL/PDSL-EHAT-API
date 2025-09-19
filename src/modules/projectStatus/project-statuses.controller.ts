import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectStatusService } from './services/project-status.service';
import { Request } from 'express';
import { CreateProjectStatusDto, PartialCreateProjectStatusDto, UpdateProjectStatusDto } from './dto/project-status.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectStatusEntity } from 'src/database/postgres/entities/project-status.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
@ApiTags('Project Statuses')
@Controller('project-statuses')
export class ProjectStatusesController {
    constructor(
        private ProjectStatusService: ProjectStatusService
    ) { }
    @ApiOperation({ summary: 'Create a new Project status' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectStatusDto })
    @ApiResponseWrapper(ProjectStatusEntity)
    @Post()
    create(@Req() req: Request, @Body() createProjectStatusDto: CreateProjectStatusDto, @Ip() ip: string): Promise<any> {
        return this.ProjectStatusService.create(createProjectStatusDto, req['user']);
    }
    @ApiOperation({ summary: 'Get Project statuses' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectStatusEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.ProjectStatusService.findAll(query);
    }
    @ApiOperation({ summary: 'Get Project status' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectStatusEntity)
    @Get(':id')
    get(@Query() query: Record<string, any>, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.ProjectStatusService.findById(id, query.relations);
    }

    @ApiOperation({ summary: 'Update Project status' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectStatusDto })
    @ApiResponseWrapper(ProjectStatusEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateProjectStatusDto: UpdateProjectStatusDto, @Ip() ip: string): Promise<any> {
        return this.ProjectStatusService.update(id, updateProjectStatusDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete Project status' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.ProjectStatusService.remove(id);
    }
}
