import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateLeaveTypeDto {
    @ApiProperty()
    @IsString()
    name: string;
    @ApiProperty()
    @IsString()
    description: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateLeaveTypeDto extends PartialType(
    OmitType(CreateLeaveTypeDto, ['createdBy', 'updatedBy'] as const)
) { }


export class UpdateLeaveTypeDto extends PartialType(OmitType(CreateLeaveTypeDto, [])) { }