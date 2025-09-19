import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { TimesheetStatusService } from './services/timesheet-status.service';
import { Request } from 'express';
import { CreateTimesheetStatusDto, PartialCreateTimesheetStatusDto, UpdateTimesheetStatusDto } from './dto/timesheet-status.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetStatusEntity } from 'src/database/postgres/entities/timesheet-status.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
@ApiTags('Timesheet Statuses')
@Controller('timesheet-statuses')
export class TimesheetStatusesController {
    constructor(
        private timesheetStatusService: TimesheetStatusService
    ) { }
    @ApiOperation({ summary: 'Create a new timesheet status' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateTimesheetStatusDto })
    @ApiResponseWrapper(TimesheetStatusEntity)
    @Post()
    create(@Req() req: Request, @Body() createTimesheetStatusDto: CreateTimesheetStatusDto, @Ip() ip: string): Promise<any> {
        return this.timesheetStatusService.create(createTimesheetStatusDto, req['user']);
    }
    @ApiOperation({ summary: 'Get timesheet statuses' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetStatusEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.timesheetStatusService.findAll(query);
    }
    @ApiOperation({ summary: 'Get timesheet status' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetStatusEntity)
    @Get(':id')
    get(@Query() query: Record<string, any>, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.timesheetStatusService.findById(id, query.relations);
    }

    @ApiOperation({ summary: 'Update timesheet status' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateTimesheetStatusDto })
    @ApiResponseWrapper(TimesheetStatusEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateTimesheetStatusDto: UpdateTimesheetStatusDto, @Ip() ip: string): Promise<any> {
        return this.timesheetStatusService.update(id, updateTimesheetStatusDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete timesheet status' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.timesheetStatusService.remove(id);
    }
}
