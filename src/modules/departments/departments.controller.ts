import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { DepartmentService } from './services/department.service';
import { Request } from 'express';
import { CreateDepartmentDto, PartialCreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { DepartmentEntity } from 'src/database/postgres/entities/department.entity';
// @Controller({ path: 'departments', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('departments')
export class DepartmentsController {
    constructor(
        private departmentService: DepartmentService
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
    getAll(@Query() query: any): Promise<any> {
        return this.departmentService.findAll(query);
    }
    @ApiOperation({ summary: 'Get department' })
    @ApiBearerAuth()
    @ApiResponseWrapper(DepartmentEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.departmentService.findById(id);
    }

    @ApiOperation({ summary: 'Update department' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateDepartmentDto })
    @ApiResponseWrapper(DepartmentEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateDepartmentDto: UpdateDepartmentDto, @Ip() ip: string): Promise<any> {
        return this.departmentService.update(id, updateDepartmentDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete department' })
    @ApiBearerAuth()
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.departmentService.remove(id);
    }
}
