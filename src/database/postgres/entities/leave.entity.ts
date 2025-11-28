import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ApiProperty } from "@nestjs/swagger";
import { LeaveTypeEntity } from "./leave-type.entity";
import { LeaveStatusEntity } from "./leave-status.entity";

@Entity('leaves')
export class LeaveEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
    @ApiProperty()
    @ManyToOne(() => LeaveTypeEntity, { nullable: true })
    @JoinColumn({ name: 'leave_type_id' })
    leaveType?: LeaveTypeEntity;
    @ApiProperty()
    @Column({ type: 'timestamp' })
    date: Date;
    @ApiProperty()
    @Column({ type: 'float', nullable: true })
    leave: number;
    @ApiProperty()
    @Column({ type: 'text', nullable: true })
    reason: string | null;
    @ApiProperty()
    @ManyToOne(() => LeaveStatusEntity, { nullable: true })
    @JoinColumn({ name: 'leave_status_id' })
    status?: LeaveStatusEntity;
    @ApiProperty()
    @Column({ type: 'timestamp', name: 'applied_on', nullable: true })
    appliedOn: Date | null;
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'approved_by' })
    approvedBy: UserEntity | null;
    @ApiProperty()
    @Column({ type: 'timestamp', name: 'approved_on', nullable: true })
    approvedOn: Date | null;
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
}