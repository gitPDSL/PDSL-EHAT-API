import {
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('project_users')
export class ProjectUserEntity {
    @ApiProperty()
    @PrimaryColumn('uuid', { name: 'project_id' })
    projectId: string;
    @ApiProperty()
    @PrimaryColumn('uuid', { name: 'user_id' })
    userId: string;
    @ApiProperty({ description: 'Billing rate for this user on this project, denominated in the client\'s currency.' })
    @Column({ type: 'numeric', precision: 12, scale: 2, name: 'hourly_rate', default: 0 })
    hourlyRate: number;
    @ApiProperty()
    @CreateDateColumn({
        type: 'timestamp',
        name: 'assigned_from_date',
        nullable: true
    })
    assignedFromDate: Date;
    @ApiProperty()
    @CreateDateColumn({
        type: 'timestamp',
        name: 'assigned_to_date',
        nullable: true
    })
    assignedToDate: Date;
    @ApiProperty()
    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
        default: () => 'now()',
    })
    createdAt: Date;
    @ApiProperty()
    @UpdateDateColumn({
        type: 'timestamp',
        name: 'updated_at',
        default: () => 'now()',
    })
    updatedAt: Date;
    // 🔹 Relation: department created by a user
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: UserEntity | null;
    // 🔹 Relation: department updated by a user
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: UserEntity | null;

    // 🔹 Relations
    @ManyToOne(() => ProjectEntity, (project) => project.userProjects, {
        onDelete: 'CASCADE',
        lazy: true,
    })
    @JoinColumn({ name: 'project_id' })
    project: Promise<ProjectEntity>;

    @ManyToOne(() => UserEntity, (user) => user.projectUsers, {
        onDelete: 'CASCADE',
        lazy: true,  // optional, but can help with circular refs too
    })
    @JoinColumn({ name: 'user_id' })
    user: Promise<UserEntity>;
}
