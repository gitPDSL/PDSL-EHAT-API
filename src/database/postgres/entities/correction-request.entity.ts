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
import { TimesheetEntity } from './timesheet.entity';
import { UserEntity } from './user.entity';

export enum CORRECTION_STATUS {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DENIED = 'DENIED',
}

@Entity({ name: 'correction_requests' })
export class CorrectionRequestEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Index('idx_correction_requests_timesheet')
    @ManyToOne(() => TimesheetEntity, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'timesheet_id' })
    timesheet: TimesheetEntity;

    @ApiProperty()
    @Column({ type: 'uuid', name: 'timesheet_id' })
    timesheetId: string;

    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: false })
    @JoinColumn({ name: 'requested_by' })
    requestedBy: UserEntity;

    @ApiProperty()
    @Column({ type: 'text' })
    reason: string;

    @ApiProperty({ enum: CORRECTION_STATUS })
    @Index('idx_correction_requests_status')
    @Column({ type: 'varchar', length: 16, default: CORRECTION_STATUS.PENDING })
    status: CORRECTION_STATUS;

    @ApiProperty({ required: false, nullable: true })
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewedBy: UserEntity | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
    reviewedAt: Date | null;

    @ApiProperty({ required: false, nullable: true })
    @Column({ type: 'text', name: 'decision_note', nullable: true })
    decisionNote: string | null;

    @ApiProperty({ required: false, nullable: true, description: 'Timestamp of the last stale-correction nudge sent to the line manager.' })
    @Column({ type: 'timestamp', name: 'nudged_at', nullable: true })
    nudgedAt: Date | null;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
