import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateTimesheetDto {
    @ApiProperty({ description: 'Id of project' })
    @IsString()
    projectId: string;
    @ApiProperty({ description: 'Id of project user' })
    @IsString()
    userId: string;
    @ApiProperty()
    @IsInt()
    weekNumber: number;
    @ApiProperty()
    @IsInt()
    year: number;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    date?: Date;
    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Max(24)
    hours: number;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    submittedAt?: Date;
    @ApiProperty()
    @IsString()
    @IsOptional()
    note?: string;
    @ApiProperty({ description: 'Id of timesheet status' })
    @IsOptional()
    status?: string;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    approvedAt?: Date;
    @ApiProperty()
    @IsString()
    @IsOptional()
    approvedBy?: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    rejectionReason?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateTimesheetDto extends PartialType(
    OmitType(CreateTimesheetDto, ['createdBy', 'updatedBy'] as const)
) { }

export class UpdateTimesheetDto extends PartialType(OmitType(CreateTimesheetDto, [])) { }