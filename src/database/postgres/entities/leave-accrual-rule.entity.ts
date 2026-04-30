import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveTypeEntity } from './leave-type.entity';

@Entity({ name: 'leave_accrual_rules' })
export class LeaveAccrualRuleEntity {
    @ApiProperty()
    @PrimaryColumn({ name: 'leave_type_id' })
    leaveTypeId: string;

    @ApiProperty({ description: 'Days accrued per month for full-time. Part-time is scaled by weeklyTargetHours / 40.' })
    @Column({ name: 'accrual_per_month', type: 'numeric', precision: 5, scale: 3, default: 0 })
    accrualPerMonth: string;

    @ApiProperty({ description: 'Maximum balance in days. Excess is forfeited at year end.' })
    @Column({ name: 'cap_days', type: 'numeric', precision: 5, scale: 2, default: 0 })
    capDays: string;

    @ApiProperty({ description: 'Maximum days that may carry forward into the next year.' })
    @Column({ name: 'carry_forward_cap', type: 'numeric', precision: 5, scale: 2, default: 0 })
    carryForwardCap: string;

    @ApiProperty()
    @Column({ name: 'applies_to_full_time', type: 'boolean', default: true })
    appliesToFullTime: boolean;

    @ApiProperty()
    @Column({ name: 'applies_to_part_time', type: 'boolean', default: true })
    appliesToPartTime: boolean;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @OneToOne(() => LeaveTypeEntity)
    @JoinColumn({ name: 'leave_type_id' })
    leaveType: LeaveTypeEntity;
}
