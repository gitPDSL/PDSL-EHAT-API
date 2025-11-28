import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateLeaveStatusDto {
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

export class PartialCreateLeaveStatusDto extends PartialType(
    OmitType(CreateLeaveStatusDto, ['createdBy', 'updatedBy'] as const)
) { }


export class UpdateLeaveStatusDto extends PartialType(OmitType(CreateLeaveStatusDto, [])) { }