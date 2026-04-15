import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateHolidayDto {
    @ApiProperty({ description: 'YYYY-MM-DD' })
    @IsDateString()
    date: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false, description: 'ISO 3166-1 alpha-2 country code. Defaults to GB.' })
    @IsOptional()
    @IsString()
    @Length(2, 2)
    country?: string;
}

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) { }

export class PartialCreateHolidayDto extends PartialType(
    OmitType(CreateHolidayDto, [] as const),
) { }
