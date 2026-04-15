import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationEntity } from 'src/database/postgres/entities/notification.entity';

export interface NotificationInput {
    userId: string;
    type: string;
    title: string;
    body: string;
    metadata?: any;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(NotificationEntity)
        private readonly repo: Repository<NotificationEntity>,
    ) { }

    async create(input: NotificationInput): Promise<NotificationEntity | null> {
        try {
            const entity = this.repo.create({
                userId: input.userId,
                type: input.type,
                title: input.title,
                body: input.body,
                metadata: input.metadata ?? null,
            });
            const saved: NotificationEntity = await this.repo.save(entity as NotificationEntity);
            return saved;
        } catch (error) {
            this.logger.error(
                `Failed to create notification for user ${input.userId} type=${input.type}: ${error?.message ?? error}`,
                error?.stack,
            );
            return null;
        }
    }

    async listForUser(userId: string, options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) {
        const { unreadOnly = false, limit = 50, offset = 0 } = options;
        const where: any = { userId };
        if (unreadOnly) where.readAt = IsNull();
        const [items, total] = await this.repo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: Math.min(Math.max(Number(limit) || 50, 1), 200),
            skip: Math.max(Number(offset) || 0, 0),
        });
        const unreadCount = await this.repo.count({ where: { userId, readAt: IsNull() } });
        return { items, total, unreadCount };
    }

    async markRead(userId: string, id: string): Promise<NotificationEntity> {
        const n = await this.repo.findOne({ where: { id, userId } });
        if (!n) throw new NotFoundException('Notification not found');
        if (!n.readAt) {
            n.readAt = new Date();
            await this.repo.save(n);
        }
        return n;
    }

    async markAllRead(userId: string): Promise<{ updated: number }> {
        const result = await this.repo
            .createQueryBuilder()
            .update(NotificationEntity)
            .set({ readAt: new Date() })
            .where('user_id = :userId', { userId })
            .andWhere('read_at IS NULL')
            .execute();
        return { updated: result.affected ?? 0 };
    }

    async remove(userId: string, id: string): Promise<{ deleted: number }> {
        const result = await this.repo.delete({ id, userId });
        return { deleted: result.affected ?? 0 };
    }
}
