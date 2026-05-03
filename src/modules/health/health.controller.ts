import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

// Render's load balancer + our cron triggers hit /api/health every few
// seconds. The default 100/min throttle would 429 it. Skip both health
// endpoints from throttling entirely.
@SkipThrottle()
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
