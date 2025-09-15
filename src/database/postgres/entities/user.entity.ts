import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToMany,
    JoinTable,
    OneToMany,
} from 'typeorm';
import { DepartmentEntity } from './department.entity';
import { RoleEntity } from './role.entity';
import { ProjectEntity } from './project.entity';
import { ProjectUserEntity } from './project-user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { TimesheetEntity } from './timesheet.entity';
export enum ACCOUNT_STATUS {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED'
}
@Entity('users')
export class UserEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @ApiProperty()
    @Column({ type: 'text', name: 'full_name', nullable: true })
    fullName: string | null;
    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    email: string | null;
    @ApiProperty()
    @Column({ type: 'text', name: 'password_hash', select: false })
    passwordHash: string;

    // ---------- Relations ----------
    @ApiProperty()
    @Index('idx_users_role_id')
    @ManyToOne(() => RoleEntity, (role) => role.users, { nullable: true, eager: true })
    @JoinColumn({ name: 'role_id' })
    role: RoleEntity | null;
    @ApiProperty()
    @Index('idx_users_designation')
    @Column({ type: 'text', nullable: true })
    designation: string | null;
    @ApiProperty()
    @Index('idx_users_manager_id')
    @ManyToOne(() => UserEntity, (user) => user.subordinates, { nullable: true })
    @JoinColumn({ name: 'manager_id' })
    manager: UserEntity | null;
    @ApiProperty()
    @Index('idx_users_department_id')
    @ManyToOne(() => DepartmentEntity, (department) => department.users, { nullable: true })
    @JoinColumn({ name: 'department_id' })
    department: DepartmentEntity | null;
    @ApiProperty()
    @Column({
        type: 'enum',
        enum: ACCOUNT_STATUS,
        default: ACCOUNT_STATUS.PENDING,
    })
    status: ACCOUNT_STATUS;

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
    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    refreshToken: string | null

    // Reverse relation for manager → subordinates
    subordinates: UserEntity[];

    @ManyToMany(() => ProjectEntity, (project) => project.users)
    @JoinTable({
        name: 'project_users',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'project_id', referencedColumnName: 'id' },
    })
    projects: ProjectEntity[];

    @OneToMany(() => ProjectUserEntity, (projectUser) => projectUser.user)
    projectUsers: ProjectUserEntity[];
    @OneToMany(() => TimesheetEntity, (timesheetUser) => timesheetUser.project)
    timesheetUsers: TimesheetEntity[];

}
