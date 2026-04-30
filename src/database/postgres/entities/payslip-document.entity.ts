import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { PayrollPeriodEntity } from './payroll-period.entity';

@Entity({ name: 'payslip_documents' })
@Unique('uq_payslip_documents_user_period', ['userId', 'payrollPeriodId'])
export class PayslipDocumentEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Index('idx_payslip_documents_user')
    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @ApiProperty()
    @Index('idx_payslip_documents_period')
    @Column({ type: 'uuid', name: 'payroll_period_id' })
    payrollPeriodId: string;

    @ApiProperty()
    @Column({ type: 'text' })
    filename: string;

    @ApiProperty()
    @Column({ type: 'varchar', length: 100, name: 'content_type', default: 'application/pdf' })
    contentType: string;

    @ApiProperty()
    @Column({ type: 'int', name: 'size_bytes', default: 0 })
    sizeBytes: number;

    /** Inline PDF bytes. Excluded from default selects so list responses don't carry the blob. */
    @Column({ type: 'bytea', select: false })
    content: Buffer;

    @ApiProperty({ required: false, nullable: true })
    @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'uploaded_by' })
    uploadedBy: UserEntity | null;

    @ApiProperty()
    @Column({ name: 'uploaded_at', type: 'timestamp', default: () => 'now()' })
    uploadedAt: Date;

    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @ManyToOne(() => PayrollPeriodEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'payroll_period_id' })
    payrollPeriod: PayrollPeriodEntity;
}
