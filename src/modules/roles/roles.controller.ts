import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { RoleService } from './services/role.service';
import { Request } from 'express';
import { CreateRoleDto, PartialCreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { RoleEntity } from 'src/database/postgres/entities/role.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
// @Controller({ path: 'roles', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('roles')
export class RolesController {
    constructor(
        private roleService: RoleService
    ) { }
    @ApiOperation({ summary: 'Create a new role' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateRoleDto })
    @ApiResponseWrapper(RoleEntity)
    @Post()
    create(@Req() req: Request, @Body() createRoleDto: CreateRoleDto, @Ip() ip: string): Promise<any> {
        return this.roleService.create(createRoleDto, req['user']);
    }
    @ApiOperation({ summary: 'Get roles' })
    @ApiBearerAuth()
    @ApiResponseWrapper(RoleEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.roleService.findAll(query);
    }
    @ApiOperation({ summary: 'Get role' })
    @ApiBearerAuth()
    @ApiResponseWrapper(RoleEntity)
    @Get(':id')
    get(@Query() query: Record<string, any>, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.roleService.findById(id, query.relations);
    }

    @ApiOperation({ summary: 'Update role' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateRoleDto })
    @ApiResponseWrapper(RoleEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto, @Ip() ip: string): Promise<any> {
        return this.roleService.update(id, updateRoleDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete role' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.roleService.remove(id);
    }
}
