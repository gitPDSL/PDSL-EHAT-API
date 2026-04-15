import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@Entity('notifications')
@Index('idx_notifications_user', ['userId'])
@Index('idx_notifications_user_unread', ['userId', 'readAt'])
export class NotificationEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Recipient user id' })
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @ApiProperty({ description: 'Notification type, e.g. timesheet.approved' })
    @Column({ type: 'text' })
    type: string;

    @ApiProperty()
    @Column({ type: 'text' })
    title: string;

    @ApiProperty()
    @Column({ type: 'text' })
    body: string;

    @ApiProperty({ description: 'Arbitrary payload including links and entity ids' })
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: 'timestamp', name: 'read_at', nullable: true })
    readAt: Date | null;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
