import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportsService } from './services/exports.service';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    @ApiOperation({ summary: 'Export a client invoice as XLSX (admin only). Filters billable hours for the given month and multiplies by the per-project-user hourly rate in the client\'s currency.' })
    @ApiBearerAuth()
    @ApiQuery({ name: 'clientId', required: true })
    @ApiQuery({ name: 'year', required: true })
    @ApiQuery({ name: 'month', required: true, description: '1-12' })
    @Roles('ADMIN')
    @Get('invoice')
    async invoice(
        @Query('clientId') clientId: string,
        @Query('year') year: string,
        @Query('month') month: string,
        @Res() res: Response,
    ): Promise<void> {
        const result = await this.exportsService.generateInvoiceWorkbook({
            clientId,
            year: Number(year),
            month: Number(month),
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('X-Invoice-Currency', result.currency);
        res.setHeader('X-Invoice-Total', String(result.total));
        res.end(result.buffer);
    }
}
