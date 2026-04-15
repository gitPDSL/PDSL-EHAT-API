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

export interface AuditLogQuery {
    entityType?: string;
    entityId?: string;
    action?: string;
    actorId?: string;
    limit?: number;
    offset?: number;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLogEntity)
        private readonly repo: Repository<AuditLogEntity>,
    ) { }

    async list(query: AuditLogQuery = {}) {
        const { entityType, entityId, action, actorId } = query;
        const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
        const offset = Math.max(Number(query.offset) || 0, 0);
        const where: any = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (action) where.action = action;
        if (actorId) where.actorId = actorId;
        const [items, total] = await this.repo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['actor'],
        });
        return { items, total, limit, offset };
    }

    async findAllForUser(userId: string) {
        return this.repo.find({
            where: [
                { actorId: userId },
                { entityType: 'User', entityId: userId },
            ],
            order: { createdAt: 'DESC' },
        });
    }

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
