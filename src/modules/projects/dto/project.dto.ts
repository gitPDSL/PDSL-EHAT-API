import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";
import { ClientEntity } from "src/database/postgres/entities/client.entity";
import { ProjectStatus } from "src/database/postgres/entities/project.entity";
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
    status?: ProjectStatus;
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