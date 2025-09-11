import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ProjectUserService } from './services/project-user.service';
import { Request } from 'express';
import { CreateProjectUserDto, PartialCreateProjectUserDto, UpdateProjectUserDto } from './dto/project-user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';

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
    create(@Req() req: Request, @Body() createProjectUserDto: CreateProjectUserDto, @Ip() ip: string): Promise<any> {
        return this.projectUserService.create(createProjectUserDto, req['user']);
    }
    @ApiOperation({ summary: 'Get project users' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectUserEntity, true)
    @Get()
    getAll(@Query() query: any): Promise<any> {
        return this.projectUserService.findAll(query);
    }
    @ApiOperation({ summary: 'Get project user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ProjectUserEntity)
    @Get(':project/:user')
    get(
        @Param('project', ParseUUIDPipe) project: string,
        @Param('user', ParseUUIDPipe) user: string
    ): Promise<any> {
        return this.projectUserService.findById(project, user);
    }

    @ApiOperation({ summary: 'Update project user' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateProjectUserDto })
    @ApiResponseWrapper(ProjectUserEntity)
    @Put(':project/:user')
    update(
        @Req() req: Request,
        @Param('project', ParseUUIDPipe) project: string,
        @Param('user', ParseUUIDPipe) user: string,
        @Body() updateProjectUserDto: UpdateProjectUserDto,
        @Ip() ip: string
    ): Promise<any> {
        return this.projectUserService.update(project, user, updateProjectUserDto, req['user']);
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
