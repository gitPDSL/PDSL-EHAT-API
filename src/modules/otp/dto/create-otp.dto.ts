import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateOtpDto {
    @ApiProperty()
    @IsString()
    code: string;
    @ApiProperty()
    user: string;
    @ApiProperty()
    @IsDateString()
    @IsOptional()
    expiredAt?: Date;
    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateOtpDto extends PartialType(
    OmitType(CreateOtpDto, ['createdBy', 'updatedBy'] as const)
) { }