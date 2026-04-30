import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { CorrectionsService } from './corrections.service';
import { CORRECTION_STATUS } from 'src/database/postgres/entities/correction-request.entity';

@Controller()
export class CorrectionsController {
    constructor(private readonly correctionsService: CorrectionsService) { }

    @ApiOperation({ summary: 'File a correction request on your own submitted/approved/rejected timesheet.' })
    @ApiBearerAuth()
    @Post('timesheets/:id/correction-request')
    async create(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) timesheetId: string,
        @Body() body: { reason: string },
    ): Promise<any> {
        const data = await this.correctionsService.createForOwner(timesheetId, body?.reason ?? '', req['user']);
        return { data };
    }

    @ApiOperation({ summary: 'List correction requests. status filter optional. mine=true returns only requests filed by the caller.' })
    @ApiBearerAuth()
    @Get('correction-requests')
    async list(
        @Req() req: Request,
        @Query('status') status?: string,
        @Query('mine') mine?: string,
    ): Promise<any> {
        const filterStatus = status ? (status.toUpperCase() as CORRECTION_STATUS) : undefined;
        if (filterStatus && !Object.values(CORRECTION_STATUS).includes(filterStatus)) {
            throw new BadRequestException('Invalid status filter');
        }
        const data = await this.correctionsService.list(
            { status: filterStatus, mine: mine === 'true' },
            req['user'],
        );
        return { data };
    }

    @ApiOperation({ summary: 'Approve or deny a correction request. Senior manager (in reporting chain) or admin.' })
    @ApiBearerAuth()
    @Put('correction-requests/:id')
    async review(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { decision: 'APPROVED' | 'DENIED'; decisionNote?: string | null },
    ): Promise<any> {
        if (body?.decision !== 'APPROVED' && body?.decision !== 'DENIED') {
            throw new BadRequestException('decision must be APPROVED or DENIED');
        }
        const data = await this.correctionsService.review(id, body.decision, body.decisionNote ?? null, req['user']);
        return { data };
    }
}
