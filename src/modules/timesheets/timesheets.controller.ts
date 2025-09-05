import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { TimesheetService } from './services/timesheet.service';
import { Request } from 'express';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { CreateTimesheetDto, PartialCreateTimesheetDto } from './dto/create-timesheet.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
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
        createTimesheetDto.createdBy = req['user'].id;
        return this.timesheetService.create(createTimesheetDto, req['user']);
    }
    @ApiOperation({ summary: 'Get timesheets' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetEntity, true)
    @Get()
    getAll(@Query() query: any): Promise<any> {
        return this.timesheetService.findAll(query);
    }
    @ApiOperation({ summary: 'Get timesheet' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.timesheetService.findById(id);
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
