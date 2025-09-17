import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { TimesheetService } from './services/timesheet.service';
import { Request } from 'express';
import { CreateTimesheetDto, PartialCreateTimesheetDto, UpdateTimesheetDto } from './dto/timesheet.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { Between } from 'typeorm';
import moment from 'moment';
// @Controller({ path: 'timesheets', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('timesheets')
export class TimesheetsController {
    constructor(
        private timesheetService: TimesheetService
    ) { }
    @ApiOperation({ summary: 'Create a new timesheet' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateTimesheetDto })
    @ApiResponseWrapper(TimesheetEntity)
    @Post()
    create(@Req() req: Request, @Body() createTimesheetDto: CreateTimesheetDto, @Ip() ip: string): Promise<any> {
        console.log('controller-----------', createTimesheetDto)
        return this.timesheetService.create(createTimesheetDto, req['user']);
    }
    @ApiOperation({ summary: 'Get timesheets' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        if (query.date) {
            let dates = query.date.split(',').filter(a => a);
            if (dates.length === 2)
                query.date = Between(new Date(dates[0]), new Date(dates[1]))
            else
                query.date = Between(new Date(moment(dates[0]).startOf('day').toISOString()), new Date(moment(dates[0]).endOf('day').toISOString()))
        }
        // console.log(query)
        return this.timesheetService.findAll(query);
    }
    @ApiOperation({ summary: 'Get timesheet' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetEntity)
    @Get(':id')
    get(@Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.timesheetService.findById(id, query.relations || []);
    }

    @ApiOperation({ summary: 'Update timesheet' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateTimesheetDto })
    @ApiResponseWrapper(TimesheetEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateTimesheetDto: UpdateTimesheetDto, @Ip() ip: string): Promise<any> {
        return this.timesheetService.update(id, updateTimesheetDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete timesheet' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.timesheetService.remove(id);
    }
}
