import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ApiProperty } from "@nestjs/swagger";
import { LeaveBalanceEntity } from "./leave-balance.entity";

@Entity({ name: 'leave_types' })
export class LeaveTypeEntity {
    @ApiProperty()
    @PrimaryColumn()
    id: string;
    @ApiProperty()
    @Column()
    name: string;
    @ApiProperty()
    @Column()
    description: string;
    @ApiProperty({ description: 'Annual entitlement in days for this leave type' })
    @Column({ name: 'default_entitlement', type: 'int', default: 0 })
    defaultEntitlement: number;
    @ApiProperty({ description: 'Whether this leave type requires manager approval before being deducted from the balance.' })
    @Column({ name: 'requires_approval', type: 'boolean', default: true })
    requiresApproval: boolean;
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
    @OneToMany(() => LeaveBalanceEntity, (leaveBalance) => leaveBalance.leaveTypeId)
    leaveBalanceTypes: LeaveBalanceEntity[];
}