import { Body, Controller, Delete, Get, Ip, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { LeaveBalanceService } from './services/leave-balance.service';
import { Request } from 'express';
import { CreateLeaveBalanceDto, PartialCreateLeaveBalanceDto, UpdateLeaveBalanceDto } from './dto/leave-balance.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
@Controller('leaveBalances')
export class LeaveBalancesController {
    constructor(
        private leaveBalanceService: LeaveBalanceService,
    ) { }
    @ApiOperation({ summary: 'Create a new leave Balance' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveBalanceDto })
    @ApiResponseWrapper(LeaveBalanceEntity)
    @Post()
    create(@Req() req: Request, @Body() createLeaveBalanceDto: CreateLeaveBalanceDto, @Ip() ip: string): Promise<any> {
        createLeaveBalanceDto.createdBy = req['user'].id;
        return this.leaveBalanceService.create(createLeaveBalanceDto, req['user']);
    }
    @ApiOperation({ summary: 'Get leave Balances' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveBalanceEntity, true)
    @Get()
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.filter(a => a);
        return this.leaveBalanceService.findAll(query);
    }
    @ApiOperation({ summary: 'Get leave Balance' })
    @ApiBearerAuth()
    @ApiResponseWrapper(LeaveBalanceEntity)
    @Get(':user/:leaveType/:year')
    get(
        @Query() query: Record<string, any> = {},
        @Param('user', ParseUUIDPipe) user: string,
        @Param('leaveType', ParseUUIDPipe) leaveType: string,
        @Param('year', ParseIntPipe) year: number,
    ): Promise<any> {
        query = QueryTransformTypeorm(query);
        if (query.relations)
            query.relations = query.relations.filter(a => a);
        return this.leaveBalanceService.findById(user, leaveType, year);
    }

    @ApiOperation({ summary: 'Update leave Balance' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateLeaveBalanceDto })
    @ApiResponseWrapper(LeaveBalanceEntity)
    @Put(':user/:leaveType/:year')
    async update(
        @Req() req: Request,
        @Query() query: Record<string, any> = {},
        @Param('user', ParseUUIDPipe) user: string,
        @Param('leaveType', ParseUUIDPipe) leaveType: string,
        @Param('year', ParseIntPipe) year: number,
        @Body() updateLeaveBalanceDto: UpdateLeaveBalanceDto,
        @Ip() ip: string
    ): Promise<any> {
        return this.leaveBalanceService.update(user, leaveType, year, updateLeaveBalanceDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete leaveBalance' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':user/:leaveType/:year')
    delete(
        @Param('user', ParseUUIDPipe) user: string,
        @Param('leaveType', ParseUUIDPipe) leaveType: string,
        @Param('year', ParseIntPipe) year: number,
    ): Promise<any> {
        return this.leaveBalanceService.remove(user, leaveType, year);
    }
}
