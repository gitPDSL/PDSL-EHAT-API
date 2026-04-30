import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportsService } from './services/exports.service';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    private send(res: Response, payload: { buffer: Buffer; filename: string }): void {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
        res.end(payload.buffer);
    }

    @ApiOperation({ summary: 'Hours by project for a date range. XLSX. Admin only. Rolls hours up by (project, employee, status).' })
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
    @Roles('SUPER_ADMIN', 'ADMIN')
    @Get('hours-by-project')
    async hoursByProject(@Query('from') from: string, @Query('to') to: string, @Res() res: Response): Promise<void> {
        this.send(res, await this.exportsService.hoursByProject({ from, to }));
    }

    @ApiOperation({ summary: 'Hours by employee for a date range. XLSX. Admin only. Splits totals across approved/submitted/pending/rejected.' })
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
    @Roles('SUPER_ADMIN', 'ADMIN')
    @Get('hours-by-user')
    async hoursByUser(@Query('from') from: string, @Query('to') to: string, @Res() res: Response): Promise<void> {
        this.send(res, await this.exportsService.hoursByUser({ from, to }));
    }

    @ApiOperation({ summary: 'Approval audit for a date range. XLSX. Admin only. Lists every timesheet status change + correction approval/denial.' })
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
    @Roles('SUPER_ADMIN', 'ADMIN')
    @Get('approval-audit')
    async approvalAudit(@Query('from') from: string, @Query('to') to: string, @Res() res: Response): Promise<void> {
        this.send(res, await this.exportsService.approvalAudit({ from, to }));
    }

    @ApiOperation({ summary: 'Leave summary as of a date. XLSX. Admin only. Per-user, per-leave-type accrued, carry-forward, taken (in range), remaining.' })
    @ApiBearerAuth()
    @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
    @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
    @Roles('SUPER_ADMIN', 'ADMIN')
    @Get('leave-summary')
    async leaveSummary(@Query('from') from: string, @Query('to') to: string, @Res() res: Response): Promise<void> {
        this.send(res, await this.exportsService.leaveSummary({ from, to }));
    }
}
