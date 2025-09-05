import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateProjectUserDto {
    @ApiProperty({description:'Id of project'})
    @IsString()
    projectId: string;
    @ApiProperty({description:'Id of user'})
    @IsString()
    userId: string;
     @ApiProperty()
    @IsString()
    @IsOptional()
    assignedFromDate?: Date;
    @ApiProperty()
    @IsString()
    @IsOptional()
    assignedToDate?: Date;
    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateProjectUserDto extends PartialType(
    OmitType(CreateProjectUserDto, ['createdBy', 'updatedBy'] as const)
) { }