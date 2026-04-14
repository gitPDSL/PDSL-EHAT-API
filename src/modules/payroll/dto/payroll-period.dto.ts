import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CreatePayrollPeriodDto {
    @ApiProperty({ description: 'Inclusive start date YYYY-MM-DD' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ description: 'Inclusive end date YYYY-MM-DD' })
    @IsDateString()
    endDate: string;
}

export class UpdatePayrollPeriodDto extends PartialType(CreatePayrollPeriodDto) {
    @ApiProperty({ required: false, nullable: true, description: 'ISO timestamp to lock; null to unlock' })
    @IsOptional()
    @IsDateString()
    lockedAt?: string | null;
}

export class PartialCreatePayrollPeriodDto extends PartialType(
    OmitType(CreatePayrollPeriodDto, [] as const),
) { }
