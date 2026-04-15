import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogEntity } from 'src/database/postgres/entities/audit-log.entity';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('audit-logs')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @ApiOperation({ summary: 'List audit log entries (admin only). Supports filtering by entityType, entityId, action, actorId, plus limit/offset paging.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(AuditLogEntity, true)
    @Roles('ADMIN')
    @Get()
    list(@Query() query: Record<string, any>): Promise<any> {
        return this.auditService.list({
            entityType: query.entityType,
            entityId: query.entityId,
            action: query.action,
            actorId: query.actorId,
            limit: query.limit ? Number(query.limit) : undefined,
            offset: query.offset ? Number(query.offset) : undefined,
        });
    }
}
