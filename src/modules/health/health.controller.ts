import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @ApiOperation({ summary: 'Liveness probe' })
    @Get('health')
    health() {
        return this.healthService.liveness();
    }

    @ApiOperation({ summary: 'Readiness probe (DB + SMTP)' })
    @Get('ready')
    ready() {
        return this.healthService.readiness();
    }
}
