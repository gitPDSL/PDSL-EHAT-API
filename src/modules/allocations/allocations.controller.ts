import { BadRequestException, Body, Controller, Get, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AllocationsService, UpsertAllocation } from './allocations.service';

@Controller('allocations')
export class AllocationsController {
    constructor(private readonly allocationsService: AllocationsService) { }

    @ApiOperation({ summary: 'Get daily allocations for a date range, optionally filtered by projects or users.' })
    @ApiBearerAuth()
    @Get('grid')
    async grid(
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('projectIds') projectIds?: string,
        @Query('userIds') userIds?: string,
    ): Promise<any> {
        if (!from || !to) throw new BadRequestException('from and to are required (YYYY-MM-DD)');
        return this.allocationsService.grid({
            from,
            to,
            projectIds: projectIds ? projectIds.split(',').filter(Boolean) : undefined,
            userIds: userIds ? userIds.split(',').filter(Boolean) : undefined,
        });
    }

    @ApiOperation({ summary: 'Bulk upsert daily allocations. Past-week edits require SENIOR_MANAGER or admin.' })
    @ApiBearerAuth()
    @Put('bulk')
    async bulkUpsert(
        @Req() req: Request,
        @Body() body: { items: UpsertAllocation[] },
    ): Promise<any> {
        if (!body?.items || !Array.isArray(body.items)) throw new BadRequestException('items array required');
        return this.allocationsService.bulkUpsert(body.items, req['user']);
    }

    @ApiOperation({ summary: 'Suggest planning cells based on the last 4 weeks of approved hours. Returns suggestions; does not write.' })
    @ApiBearerAuth()
    @Post('suggest')
    async suggest(
        @Body() body: { from: string; to: string; userIds?: string[]; projectIds?: string[] },
    ): Promise<any> {
        if (!body?.from || !body?.to) throw new BadRequestException('from and to are required (YYYY-MM-DD)');
        return this.allocationsService.suggest(body);
    }

    @ApiOperation({ summary: 'Copy a user\'s allocations from one week forward by 7 days.' })
    @ApiBearerAuth()
    @Post('copy-week')
    async copyWeekForward(
        @Req() req: Request,
        @Body() body: { userId: string; sourceWeekStart: string },
    ): Promise<any> {
        if (!body?.userId || !body?.sourceWeekStart) throw new BadRequestException('userId and sourceWeekStart required');
        const upserted = await this.allocationsService.copyWeekForward(body.userId, body.sourceWeekStart, req['user']);
        return { upserted };
    }
}
