import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { DepartmentService } from './services/department.service';
import { Request } from 'express';
import { CreateDepartmentDto, PartialCreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { DepartmentEntity } from 'src/database/postgres/entities/department.entity';
import { UserService } from '../users/services/user.service';
@Controller('departments')
export class DepartmentsController {
    constructor(
        private departmentService: DepartmentService,
        private userService: UserService
    ) { }
    @ApiOperation({ summary: 'Create a new department' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateDepartmentDto })
    @ApiResponseWrapper(DepartmentEntity)
    @Post()
    create(@Req() req: Request, @Body() createDepartmentDto: CreateDepartmentDto, @Ip() ip: string): Promise<any> {
        createDepartmentDto.createdBy = req['user'].id;
        return this.departmentService.create(createDepartmentDto, req['user']);
    }
    @ApiOperation({ summary: 'Get departments' })
    @ApiBearerAuth()
    @ApiResponseWrapper(DepartmentEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.departmentService.findAll(query);
    }
    @ApiOperation({ summary: 'Get department' })
    @ApiBearerAuth()
    @ApiResponseWrapper(DepartmentEntity)
    @Get(':id')
    get(@Query() query: Record<string, any>, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.departmentService.findById(id, query.relations);
    }

    @ApiOperation({ summary: 'Update department' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateDepartmentDto })
    @ApiResponseWrapper(DepartmentEntity)
    @Put(':id')
    async update(@Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDepartmentDto: UpdateDepartmentDto,
        @Query() query: Record<string, any>): Promise<any> {
        if (id && query.userUpdate)
            // remove department from all user
            try {
                await this.userService.bulkUpdate({ department: id }, { department: null }, req['user']);
            } catch (er) {
                console.error('-=-===-==--===-----', er)
            }
        return this.departmentService.update(id, updateDepartmentDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete department' })
    @ApiBearerAuth()
    @Delete(':id')
    async delete(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        // console.log('hi-----------------------------------')
        try {
            await this.userService.bulkUpdate({ department: id }, { department: null }, req['user']);
        } catch (er) {
            console.error('-=-===-==--===-----', er)
        }
        return this.departmentService.remove(id);
    }
}
