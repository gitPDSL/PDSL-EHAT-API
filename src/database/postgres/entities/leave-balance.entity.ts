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
    @Column({ name: 'leaves_used', type: 'int' })
    leavesUsed: number;
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
