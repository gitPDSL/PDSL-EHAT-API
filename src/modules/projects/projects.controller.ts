import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { Request } from 'express';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectDto, PartialCreateProjectDto } from './dto/create-project.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
// @Controller({ path: 'projects', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('projects')
export class ProjectsController {
    constructor(
        private projectService: ProjectService
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
    getAll(@Query() query: any): Promise<any> {
        return this.projectService.findAll(query);
    }
    @ApiOperation({ summary: 'Get project' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.projectService.findById(id);
    }

    @ApiOperation({ summary: 'Update project' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectDto })
    @ApiResponseWrapper(ProjectEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateProjectDto: UpdateProjectDto, @Ip() ip: string): Promise<any> {
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
