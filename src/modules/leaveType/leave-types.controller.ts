import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { LeaveTypeService } from './services/leave-type.service';
import { Request } from 'express';
import { CreateLeaveTypeDto, PartialCreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { LeaveTypeEntity } from 'src/database/postgres/entities/leave-type.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
@Controller('leave-types')
export class LeaveTypesController {
    constructor(
        private leaveTypeService: LeaveTypeService
    ) { }
    @ApiOperation({ summary: 'Create a new Leave Type' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveTypeDto })
    @ApiResponseWrapper(LeaveTypeEntity)
    @Post()
    create(@Req() req: Request, @Body() createLeaveTypeDto: CreateLeaveTypeDto, @Ip() ip: string): Promise<any> {
        return this.leaveTypeService.create(createLeaveTypeDto, req['user']);
    }
    @ApiOperation({ summary: 'Get Leave Types' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveTypeEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.leaveTypeService.findAll(query);
    }
    @ApiOperation({ summary: 'Get Leave Type' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveTypeEntity)
    @Get(':id')
    get(@Query() query: Record<string, any>, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.leaveTypeService.findById(id, query.relations);
    }

    @ApiOperation({ summary: 'Update Leave Type' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveTypeDto })
    @ApiResponseWrapper(LeaveTypeEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateLeaveTypeDto: UpdateLeaveTypeDto, @Ip() ip: string): Promise<any> {
        return this.leaveTypeService.update(id, updateLeaveTypeDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete Leave Type' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.leaveTypeService.remove(id);
    }
}
