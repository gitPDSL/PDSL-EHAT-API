import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
@Index('idx_audit_entity', ['entityType', 'entityId'])
@Index('idx_audit_created_at', ['createdAt'])
export class AuditLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'actor_id' })
    actor: UserEntity | null;

    @Column({ name: 'actor_id', type: 'uuid', nullable: true })
    actorId: string | null;

    @Column({ type: 'text' })
    action: string;

    @Column({ type: 'text', name: 'entity_type' })
    entityType: string;

    @Column({ type: 'text', name: 'entity_id' })
    entityId: string;

    @Column({ type: 'jsonb', nullable: true })
    before: any;

    @Column({ type: 'jsonb', nullable: true })
    after: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
