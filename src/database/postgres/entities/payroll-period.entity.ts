import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

@Entity('payroll_periods')
@Index('idx_payroll_period_range', ['startDate', 'endDate'])
export class PayrollPeriodEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Inclusive start date of the payroll period (YYYY-MM-DD)' })
    @Column({ type: 'date', name: 'start_date' })
    startDate: string;

    @ApiProperty({ description: 'Inclusive end date of the payroll period (YYYY-MM-DD)' })
    @Column({ type: 'date', name: 'end_date' })
    endDate: string;

    @ApiProperty({ description: 'When the period was locked. Null means open.' })
    @Column({ type: 'timestamp', name: 'locked_at', nullable: true })
    lockedAt: Date | null;

    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'locked_by' })
    lockedBy: UserEntity | null;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: UserEntity | null;
}
