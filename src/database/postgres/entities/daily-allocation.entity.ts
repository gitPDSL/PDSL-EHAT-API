import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'daily_allocations' })
@Unique('uq_daily_allocations_user_project_date', ['userId', 'projectId', 'date'])
export class DailyAllocationEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Index('idx_daily_allocations_user_date')
    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @ApiProperty()
    @Index('idx_daily_allocations_project_date')
    @Column({ type: 'uuid', name: 'project_id' })
    projectId: string;

    @ApiProperty()
    @Index('idx_daily_allocations_date')
    @Column({ type: 'date' })
    date: string;

    @ApiProperty()
    @Column({ name: 'planned_hours', type: 'numeric', precision: 5, scale: 2, default: 0 })
    plannedHours: string;

    @ApiProperty({ required: false, nullable: true })
    @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'planned_by' })
    plannedBy: UserEntity | null;

    @ApiProperty()
    @Column({ name: 'planned_at', type: 'timestamp', default: () => 'now()' })
    plannedAt: Date;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @ManyToOne(() => ProjectEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: ProjectEntity;
}
