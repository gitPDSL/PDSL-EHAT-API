import {
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveStatusEntity } from './leave-status.entity';
import { LeaveTypeEntity } from './leave-type.entity';

@Entity('leave_balances')
export class LeaveBalanceEntity {
    @ApiProperty()
    @PrimaryColumn('uuid', { name: 'user_id' })
    userId: string;
    @ApiProperty()
    @PrimaryColumn('uuid', { name: 'leave_type_id' })
    leaveTypeId: string;
    @ApiProperty()
    @PrimaryColumn({ type: 'int' })
    year: number;
    @ApiProperty()
    @Column({ name: 'total_leaves', type: 'int' })
    totalLeaves: number;
    @ApiProperty()
    @Column({ name: 'per_month_leaves_used', type: 'int' })
    perMonthLeaveUsed: number;
    @ApiProperty()
    @Column({ name: 'disable_months' })
    disableMonths: string;
    @ApiProperty()
    @Column({ name: 'leaves_used', type: 'int' })
    leavesUsed: number;

    @ApiProperty({ description: 'Days accrued so far this calendar year.' })
    @Column({ name: 'accrued_this_year', type: 'numeric', precision: 6, scale: 2, default: 0 })
    accruedThisYear: string;

    @ApiProperty({ required: false, nullable: true, description: 'Last accrual run date (YYYY-MM-DD). Used by the monthly cron to skip already-processed months.' })
    @Column({ name: 'last_accrual_at', type: 'date', nullable: true })
    lastAccrualAt: string | null;

    @ApiProperty({ description: 'Carried forward from prior year, capped at the rule\'s carry_forward_cap.' })
    @Column({ name: 'carry_forward', type: 'numeric', precision: 6, scale: 2, default: 0 })
    carryForward: string;
    @ApiProperty()
    @ManyToOne(() => LeaveStatusEntity, { nullable: true })
    @JoinColumn({ name: 'leave_status_id' })
    status?: LeaveStatusEntity;
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
    @ManyToOne(() => LeaveTypeEntity, (leaveType) => leaveType.leaveBalanceTypes, {
        onDelete: 'CASCADE',
        lazy: true,
    })
    @JoinColumn({ name: 'leave_type_id' })
    leaveType: Promise<LeaveTypeEntity>;

    @ManyToOne(() => UserEntity, (user) => user.leaveBalanceUsers, {
        onDelete: 'CASCADE',
        lazy: true,  // optional, but can help with circular refs too
    })
    @JoinColumn({ name: 'user_id' })
    user: Promise<UserEntity>;
}
