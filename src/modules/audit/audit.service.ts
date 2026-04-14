import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from 'src/database/postgres/entities/audit-log.entity';

export interface AuditLogInput {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    before?: any;
    after?: any;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLogEntity)
        private readonly repo: Repository<AuditLogEntity>,
    ) { }

    async log(input: AuditLogInput): Promise<void> {
        try {
            await this.repo.save(
                this.repo.create({
                    actorId: input.actorId ?? null,
                    action: input.action,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    before: input.before ?? null,
                    after: input.after ?? null,
                } as any),
            );
        } catch (error) {
            this.logger.error(
                `Audit write failed for ${input.entityType} ${input.entityId} action=${input.action}: ${error?.message ?? error}`,
                error?.stack,
            );
        }
    }
}
