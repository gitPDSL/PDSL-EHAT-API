import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateClientDto {
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
export class PartialCreateClientDto extends PartialType(
  OmitType(CreateClientDto, ['createdBy', 'updatedBy'] as const)
) {}