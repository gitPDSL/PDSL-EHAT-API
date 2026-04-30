import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PanelService } from './panel.service';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('panel')
export class PanelController {
    constructor(private readonly panelService: PanelService) { }

    @ApiOperation({ summary: 'Manager / admin panel summary: pending counts and team utilisation. Scoped to caller\'s reporting chain.' })
    @ApiBearerAuth()
    @Roles('SUPER_ADMIN', 'ADMIN', 'SENIOR_MANAGER', 'MANAGER')
    @Get('summary')
    async summary(@Req() req: Request): Promise<any> {
        const data = await this.panelService.summary(req['user']);
        return { data };
    }
}
