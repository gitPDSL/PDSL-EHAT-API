import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { LeaveService } from './services/leave.service';
import { Request } from 'express';
import { CreateLeaveDto, PartialCreateLeaveDto, UpdateLeaveDto } from './dto/leave.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
import { Between, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual } from 'typeorm';
import * as moment from 'moment';
import { RequireEmployment } from 'src/decorators/employment.decorator';

@RequireEmployment('EMPLOYEE')
@Controller('leaves')
export class LeavesController {
    constructor(
        private leaveService: LeaveService,
    ) { }
    @ApiOperation({ summary: 'Create a new leave' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveDto })
    @ApiResponseWrapper(LeaveEntity)
    @Post()
    create(@Req() req: Request, @Body() createLeaveDto: CreateLeaveDto, @Ip() ip: string): Promise<any> {
        createLeaveDto.createdBy = req['user'].id;
        return this.leaveService.create(createLeaveDto, req['user']);
    }
    @ApiOperation({ summary: 'Get leaves' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        const date = query.date;
        // LeaveEntity has startDate + endDate columns, not a single date
        // column. Translate the inbound `date` query (single day, range,
        // or comparison) into an overlap filter so leaves that touch the
        // requested window match.
        delete query.date;
        query = QueryTransformTypeorm(query);
        if (date) {
            if (date.includes('>=')) {
                query.endDate = MoreThanOrEqual(new Date(date.replace('>=', '')));
            } else if (date.includes('>')) {
                query.endDate = MoreThan(new Date(date.replace('>', '')));
            } else if (date.includes('<=')) {
                query.startDate = LessThanOrEqual(new Date(date.replace('<=', '')));
            } else if (date.includes('<')) {
                query.startDate = LessThan(new Date(date.replace('<', '')));
            } else {
                const dates = date.split(',').filter((a: any) => a);
                const from = dates[0] ? moment(dates[0]).startOf('day').toDate() : null;
                const to = dates[1] ? moment(dates[1]).endOf('day').toDate()
                    : (dates[0] ? moment(dates[0]).endOf('day').toDate() : null);
                // A leave overlaps [from, to] iff startDate <= to AND endDate >= from.
                if (to) query.startDate = LessThanOrEqual(to);
                if (from) query.endDate = MoreThanOrEqual(from);
            }
        }
        if (query.relations)
            query.relations = query.relations.filter(a => a);
        return this.leaveService.findAll(query);
    }
    @ApiOperation({ summary: 'Get leave' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveEntity)
    @Get(':id')
    get(@Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.filter(a => a);
        return this.leaveService.findById(id);
    }

    @ApiOperation({ summary: 'Update leave' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveDto })
    @ApiResponseWrapper(LeaveEntity)
    @Put(':id')
    async update(@Req() req: Request, @Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string, @Body() updateLeaveDto: UpdateLeaveDto, @Ip() ip: string): Promise<any> {
        return this.leaveService.update(id, updateLeaveDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete leave' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.leaveService.remove(id);
    }
}
