import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity'; // Adjust paths as needed
import { TimesheetStatusEntity } from './timesheet-status.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'timesheets' })
export class TimesheetEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // @ApiProperty()
  // @ManyToOne(() => ProjectUserEntity, { nullable: true })
  // @JoinColumn({ name: 'project_user_id' })
  // projectUser?: ProjectUserEntity;
  @ApiProperty({ description: 'UUID of related project' })
  @ManyToOne(() => ProjectEntity, { nullable: true })
  @Column({ name: 'project_id' })
  projectId: string;

  @ApiProperty({ description: 'UUID of related user' })
  @ManyToOne(() => UserEntity, { nullable: true })
  @Column({ name: 'user_id' })
  userId: string;
  @ApiProperty()
  @Column('integer')
  weekNumber: number;
  @ApiProperty()
  @Column('integer')
  year: number;
  @ApiProperty()
  @Column('timestamp')
  date?: Date;
  @ApiProperty()
  @Column('float', { default: 0, name: 'hours' })
  hours?: Number;
  @ApiProperty()
  @Column('timestamp', { nullable: true, default: () => 'now()', name: 'submitted_at' })
  submittedAt?: Date;
  @ApiProperty()
  @Column('text', { nullable: true, name: 'note' })
  note?: string;
  @ApiProperty()
  @ManyToOne(() => TimesheetStatusEntity, { nullable: true })
  @JoinColumn({ name: 'status' })
  status?: TimesheetStatusEntity;
  @ApiProperty()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: UserEntity | null;
  @ApiProperty()
  @Column('timestamp', { nullable: true, name: 'approved_at' })
  approvedAt?: Date;
  @ApiProperty()
  @Column('text', { nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;
  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', default: () => 'now()', type: 'timestamp' })
  createdAt: Date;
  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
  @ApiProperty()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity | null;
  @ApiProperty()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity | null;

  // 🔹 Relations
  @ManyToOne(() => ProjectEntity, (project) => project.timesheetProjects, {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'project_id' })
  project: Promise<ProjectEntity>;

  @ManyToOne(() => UserEntity, (user) => user.timesheetUsers, {
    onDelete: 'CASCADE',
    lazy: true,  // optional, but can help with circular refs too
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;
}
