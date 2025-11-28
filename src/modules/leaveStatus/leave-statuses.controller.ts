import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { LeaveStatusService } from './services/leave-status.service';
import { Request } from 'express';
import { CreateLeaveStatusDto, PartialCreateLeaveStatusDto, UpdateLeaveStatusDto } from './dto/leave-status.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { LeaveStatusEntity } from 'src/database/postgres/entities/leave-status.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
@Controller('leave-statuses')
export class LeaveStatusesController {
    constructor(
        private leaveStatusService: LeaveStatusService
    ) { }
    @ApiOperation({ summary: 'Create a new leaveStatus' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveStatusDto })
    @ApiResponseWrapper(LeaveStatusEntity)
    @Post()
    create(@Req() req: Request, @Body() createLeaveStatusDto: CreateLeaveStatusDto, @Ip() ip: string): Promise<any> {
        return this.leaveStatusService.create(createLeaveStatusDto, req['user']);
    }
    @ApiOperation({ summary: 'Get leaveStatuss' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveStatusEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.leaveStatusService.findAll(query);
    }
    @ApiOperation({ summary: 'Get leaveStatus' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveStatusEntity)
    @Get(':id')
    get(@Query() query: Record<string, any>, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.leaveStatusService.findById(id, query.relations);
    }

    @ApiOperation({ summary: 'Update leaveStatus' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveStatusDto })
    @ApiResponseWrapper(LeaveStatusEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateLeaveStatusDto: UpdateLeaveStatusDto, @Ip() ip: string): Promise<any> {
        return this.leaveStatusService.update(id, updateLeaveStatusDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete leaveStatus' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.leaveStatusService.remove(id);
    }
}
