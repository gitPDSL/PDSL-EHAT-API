import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateDepartmentDto {
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
export class PartialCreateDepartmentDto extends PartialType(
    OmitType(CreateDepartmentDto, ['createdBy', 'updatedBy'] as const)
) { }