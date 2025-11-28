import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateLeaveDto {
    @ApiProperty({ description: 'id of User' })
    @IsString()
    user: string;
    @ApiProperty({ description: 'id of Leave type' })
    @IsString()
    leaveType: string;
    @ApiProperty()
    @IsDateString()
    date?: string;
    @ApiProperty()
    @IsNumber()
    leave?: number;
    @ApiProperty()
    @IsString()
    @IsOptional()
    reason?: string;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    appliedOn?: Date;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    approvedOn?: Date;
    @ApiProperty()
    @IsString()
    @IsOptional()
    approvedBy?: string;
    @ApiProperty()
    @IsOptional()
    status?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateLeaveDto extends PartialType(
    OmitType(CreateLeaveDto, ['createdBy', 'updatedBy'] as const)
) { }

export class UpdateLeaveDto extends PartialType(OmitType(CreateLeaveDto, [])) { }