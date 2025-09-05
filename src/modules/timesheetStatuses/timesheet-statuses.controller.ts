import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { TimesheetStatusService } from './services/timesheet-status.service';
import { Request } from 'express';
import { UpdateTimesheetStatusDto } from './dto/update-timesheet-status.dto';
import { CreateTimesheetStatusDto, PartialCreateTimesheetStatusDto } from './dto/create-timesheet-status.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetStatusEntity } from 'src/database/postgres/entities/timesheet-status.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
// @Controller({ path: 'timesheet-statuses', host: ':api.example.com' }) get dynamic host with @PostParams()\
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
    getAll(@Query() query: any): Promise<any> {
        return this.timesheetStatusService.findAll(query);
    }
    @ApiOperation({ summary: 'Get timesheet status' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetStatusEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.timesheetStatusService.findById(id);
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
