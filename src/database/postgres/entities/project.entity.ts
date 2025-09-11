import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ClientEntity } from "./client.entity";
import { ProjectUserEntity } from "./project-user.entity";
import { ApiProperty } from "@nestjs/swagger";
import { TimesheetEntity } from "./timesheet.entity";
import { ProjectStatusEntity } from "./project-status.entity";

export enum ProjectStatus {
    // Define enum values that correspond to your PostgreSQL enum `public.project_status`
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ONHOLD = 'on_hold',
    // Add other statuses as needed
}
@Entity('projects')
export class ProjectEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @ApiProperty()
    @Column({ type: 'text' })
    name: string;
    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    description: string | null;
    @ApiProperty()
    @Column({ type: 'int', name: 'allocated_hours', default: 0 })
    allocatedHours: number;
    @ApiProperty()
    @Index('idx_projects_client_id')
    @ManyToOne(() => ClientEntity, { nullable: true })
    @JoinColumn({ name: 'client_id' })
    client: ClientEntity;
    @ApiProperty()
    // @Index('idx_projects_completed_at', { where: '"completed_at" IS NOT NULL' })
    @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
    completedAt: Date | null;
    @ApiProperty()
    @ManyToOne(() => ProjectStatusEntity, { nullable: true })
    @JoinColumn({ name: 'status' })
    status?: ProjectStatusEntity;
    @ApiProperty()
    @CreateDateColumn({ type: 'timestamp', name: 'started_at', nullable: true })
    startedAt: Date;

    @ApiProperty()
    @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
    createdAt: Date;
    @ApiProperty()
    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', default: () => 'now()' })
    updatedAt: Date;
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: UserEntity | null;
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: UserEntity | null;


    @ManyToMany(() => UserEntity, (user) => user.projects)
    users: UserEntity[];

    @OneToMany(() => ProjectUserEntity, (userProject) => userProject.project)
    userProjects: ProjectUserEntity[];

    @OneToMany(() => TimesheetEntity, (projectUser) => projectUser.project)
    timesheetProjects: TimesheetEntity[];
}