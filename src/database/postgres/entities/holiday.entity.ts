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

@Entity('holidays')
@Index('idx_holidays_country_date', ['country', 'date'], { unique: true })
export class HolidayEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Holiday date (YYYY-MM-DD)' })
    @Column({ type: 'date' })
    date: string;

    @ApiProperty()
    @Column({ type: 'text' })
    name: string;

    @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code. Defaults to GB.' })
    @Column({ type: 'varchar', length: 2, default: 'GB' })
    country: string;

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

    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: UserEntity | null;
}
