import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { TimesheetService } from './services/timesheet.service';
import { Request } from 'express';
import { CreateTimesheetDto, PartialCreateTimesheetDto, UpdateTimesheetDto } from './dto/timesheet.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { Between } from 'typeorm';
import moment from 'moment';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
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
        return this.timesheetService.create(createTimesheetDto, req['user']);
    }
    @ApiOperation({ summary: 'Get timesheets' })
    @ApiBearerAuth()
    @ApiResponseWrapper(TimesheetEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        // console.log('in controller before transform', query)
        const status = query.status;
        const relations = query.relations;
        const weekNumber = query.weekNumber;
        const or = query['$or'];
        const date = query.date;
        query = QueryTransformTypeorm(query);
        if (status)
            query.status = status;
        if (weekNumber) {
            let weeks = weekNumber.split(',');
            if (weeks.length > 1)
                query.weekNumber = Between(weeks[0], weeks[1]);
            else
                query.weekNumber = weekNumber;
        }
        if (relations) {
            const deepRelations = {};
            relations.split(',').filter(a => a).map((a: any) => {
                if (a.includes('.')) {
                    let deepRl = a.split('.').filter(i => i);
                    deepRelations[deepRl[0]] = deepRelations[deepRl[0]] || {};
                    deepRelations[deepRl[0]][deepRl[1]] = true;
                } else
                    deepRelations[a] = true;
                return a;
            });
            query.relations = deepRelations;
        }
        if (date) {
            let dates = date.split(',').filter(a => a);
            if (dates.length === 2)
                query.date = Between(new Date(dates[0]), new Date(dates[1]))
            else
                query.date = Between(new Date(moment(dates[0]).startOf('day').toISOString()), new Date(moment(dates[0]).endOf('day').toISOString()))
        }
        if (or) {
            let condts = or.split('|').filter(a => a);
            let orQuery = {};
            for (let c of condts) {
                let spc = c.split(':').filter(a => a);
                if (spc.length > 1) {
                    let spcs = spc[1].split(',')
                    orQuery[spc[0]] = spc[1].includes(',') ? Between(Number(spcs[0]), Number(spcs[1])) : spc[0] == 'year' || spc[0] == 'weekNumber' ? Number(spc[1]) : spc[1];
                }
            }
            query['$or'] = orQuery;
        }
        console.log('in controller', query)
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
