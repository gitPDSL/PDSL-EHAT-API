import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectUserService } from './services/project-user.service';
import { Request } from 'express';
import { CreateProjectUserDto, PartialCreateProjectUserDto, UpdateProjectUserDto } from './dto/project-user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { In } from 'typeorm';
import { QueryTransformTypeorm } from 'src/utills/common.utill';

@Controller('project-users')
export class ProjectUsersController {
    constructor(
        private projectUserService: ProjectUserService
    ) { }
    @ApiOperation({ summary: 'Create a new project user' })
    @ApiBearerAuth()
    @ApiBody({ type: CreateProjectUserDto })
    @ApiResponseWrapper(ProjectUserEntity)
    @Post()
    async create(@Req() req: Request, @Body() createProjectUserDto: CreateProjectUserDto | CreateProjectUserDto[], @Ip() ip: string): Promise<any> {
        if (Array.isArray(createProjectUserDto)) {
            let projectUsers: any = [];
            for (let data of createProjectUserDto) {
                let projectUser = await this.projectUserService.create(data, req['user']);
                projectUsers.push(projectUser);
            }
            return projectUsers;
        } else
            return this.projectUserService.create(createProjectUserDto, req['user']);
    }
    @ApiOperation({ summary: 'Get project users' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectUserEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.projectUserService.findAll(query);
    }
    @ApiOperation({ summary: 'Get project user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectUserEntity)
    @Get(':project/:user')
    get(
        @Param('project', ParseUUIDPipe) project: string,
        @Param('user', ParseUUIDPipe) user: string,
        @Query() query: Record<string, any>
    ): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.projectUserService.findById(project, user, query.relations);
    }
    @Put('bulk-update')
    async bulkUpdate(
        @Req() req: Request,
        @Body() updateUserDto: UpdateProjectUserDto,
        @Query() query: Record<string, any> = {}
    ): Promise<any> {
        if (query.id) {
            query.id = query.id.split(',');
            query.id = In(query.id);
        }
        return this.projectUserService.bulkUpdate(query, updateUserDto, req['user']);
    }
    @ApiOperation({ summary: 'Update project user' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectUserDto })
    @ApiResponseWrapper(ProjectUserEntity)
    @Put(':project/:user')
    async update(
        @Req() req: Request,
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() updateProjectUserDto: UpdateProjectUserDto,
        @Ip() ip: string
    ): Promise<any> {
        return this.projectUserService.update(projectId, userId, updateProjectUserDto, req['user']);
    }


    @ApiOperation({ summary: 'Delete project user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':project/:user')
    delete(
        @Param('project', ParseUUIDPipe) project: string,
        @Param('user', ParseUUIDPipe) user: string,
    ): Promise<any> {
        return this.projectUserService.remove(project, user);
    }
}
