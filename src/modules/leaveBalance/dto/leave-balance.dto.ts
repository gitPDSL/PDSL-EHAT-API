import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateLeaveBalanceDto {
    @ApiProperty()
    @IsString()
    userId: string;
    @ApiProperty()
    @IsString()
    leaveTypeId: string;
    @ApiProperty()
    @IsInt()
    year?: number;
    @ApiProperty()
    @IsInt()
    totalLeaves?: number;
    @ApiProperty()
    @IsInt()
    perMonthLeaveUsed?: number;
    @ApiProperty()
    @IsString()
    disableMonths?: string;
    @ApiProperty()
    @IsInt()
    leavesUsed?: number;
    @ApiProperty()
    @IsOptional()
    status?: string;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    startedAt?: Date;

    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateLeaveBalanceDto extends PartialType(
    OmitType(CreateLeaveBalanceDto, ['createdBy', 'updatedBy'] as const)
) { }

export class UpdateLeaveBalanceDto extends PartialType(OmitType(CreateLeaveBalanceDto, [])) { }