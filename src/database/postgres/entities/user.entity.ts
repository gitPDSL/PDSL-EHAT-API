import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
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
import { LeaveBalanceEntity } from './leave-balance.entity';
export enum ACCOUNT_STATUS {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED'
}
export enum EMPLOYMENT_TYPE {
    EMPLOYEE = 'EMPLOYEE',
    CONTRACTOR = 'CONTRACTOR',
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
    @Column({ type: 'text', nullable: true, unique: true })
    email: string | null;
    @ApiProperty({ required: false, nullable: true, description: '4-5 digit company employee id.' })
    @Column({ type: 'varchar', length: 8, name: 'employee_id', nullable: true, unique: true })
    employeeId: string | null;
    @ApiProperty({ required: false, nullable: true, description: 'Auto-generated from full name + employee id. Accepted as a login identifier in place of email.' })
    @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
    username: string | null;
    @ApiProperty()
    @Column({ type: 'text', name: 'password_hash', select: false, nullable: true })
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

    @ApiProperty({ required: false, nullable: true, description: 'EMPLOYEE for users on a recognised company domain (see EMPLOYEE_DOMAINS env), CONTRACTOR otherwise.' })
    @Column({ type: 'varchar', length: 16, name: 'employment_type', nullable: true })
    employmentType: EMPLOYMENT_TYPE | null;

    @ApiProperty({ description: 'Daily target hours used for utilisation widgets. No upper limit is enforced.' })
    @Column({ type: 'numeric', precision: 4, scale: 2, name: 'daily_target_hours', default: 8 })
    dailyTargetHours: string;

    @ApiProperty({ description: 'Weekly target hours used for utilisation widgets. No upper limit is enforced.' })
    @Column({ type: 'numeric', precision: 5, scale: 2, name: 'weekly_target_hours', default: 40 })
    weeklyTargetHours: string;

    @ApiProperty({ required: false, nullable: true, description: 'Hire date used for first-month leave accrual proration.' })
    @Column({ type: 'date', name: 'hire_date', nullable: true })
    hireDate: string | null;

    @ApiProperty({ required: false, nullable: true, description: 'FULL_TIME or PART_TIME. Part-time scales leave accrual by weeklyTargetHours / 40.' })
    @Column({ type: 'varchar', length: 16, name: 'contract_type', nullable: true })
    contractType: string | null;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', default: () => 'now()', type: 'timestamp' })
    createdAt: Date;
    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
    @ApiProperty({ required: false, nullable: true })
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;
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

    @ApiProperty({ required: false, nullable: true, description: 'User id that this user delegates approval authority to during an active window.' })
    @Column({ type: 'uuid', name: 'delegate_manager_id', nullable: true })
    delegateManagerId: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: 'date', name: 'delegate_from', nullable: true })
    delegateFrom: string | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: 'date', name: 'delegate_to', nullable: true })
    delegateTo: string | null;

    // Reverse relation for manager → subordinates
    @OneToMany(() => UserEntity, (user) => user.manager)
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
    @OneToMany(() => ProjectEntity, (project) => project.manager, { lazy: true })
    managerProjects: ProjectEntity[];
    @OneToMany(() => LeaveBalanceEntity, (leaveBalance) => leaveBalance.userId)
    leaveBalanceUsers: LeaveBalanceEntity[];
}
