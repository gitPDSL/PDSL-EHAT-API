import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateTimesheetStatusDto {
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

export class PartialCreateTimesheetStatusDto extends PartialType(
    OmitType(CreateTimesheetStatusDto, ['createdBy', 'updatedBy'] as const)
) { }

export class UpdateTimesheetStatusDto extends PartialType(OmitType(CreateTimesheetStatusDto, [])) { }