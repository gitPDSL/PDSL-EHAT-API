import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateProjectDto {
    @ApiProperty()
    @IsString()
    name: string;
    @ApiProperty()
    @IsString()
    description: string;
    @ApiProperty()
    @IsInt()
    @IsOptional()
    allocatedHours?: number;
    @ApiProperty({ description: 'id of Client' })
    @IsString()
    @IsOptional()
    client?: string;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    completedAt?: Date;
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

export class PartialCreateProjectDto extends PartialType(
    OmitType(CreateProjectDto, ['createdBy', 'updatedBy'] as const)
) { }

export class UpdateProjectDto extends PartialType(OmitType(CreateProjectDto, [])) { }