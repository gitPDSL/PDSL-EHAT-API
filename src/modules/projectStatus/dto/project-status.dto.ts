import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateProjectStatusDto {
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

export class PartialCreateProjectStatusDto extends PartialType(
    OmitType(CreateProjectStatusDto, ['createdBy', 'updatedBy'] as const)
) { }

export class UpdateProjectStatusDto extends PartialType(OmitType(CreateProjectStatusDto, [])) { }