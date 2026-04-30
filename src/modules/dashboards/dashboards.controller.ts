import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('dashboards')
export class DashboardsController {
    constructor(private readonly dashboardsService: DashboardsService) { }

    @ApiOperation({ summary: 'Capacity dashboard summary for the given date range. Admin / senior manager / manager only.' })
    @ApiBearerAuth()
    @Roles('SUPER_ADMIN', 'ADMIN', 'SENIOR_MANAGER', 'MANAGER')
    @Get('summary')
    async summary(@Query('from') from: string, @Query('to') to: string): Promise<any> {
        if (!from || !to) throw new BadRequestException('from and to are required (YYYY-MM-DD)');
        return this.dashboardsService.summary(from, to);
    }
}
