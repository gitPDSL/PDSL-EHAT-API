import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ACCOUNT_STATUS } from "src/constants/account.constants";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    fullName?: string;
    @ApiProperty()
    @IsEmail()
    @IsString()
    email: string;
    @ApiProperty()
    @IsOptional()
    @MinLength(8)
    password: string;
    @ApiProperty()
    @IsOptional()
    @IsString()
    designation?: string;
    @ApiProperty({ description: 'Id of department' })
    @IsOptional()
    department?: string | null;
    @ApiProperty()
    @IsOptional()
    status?: ACCOUNT_STATUS;
    @ApiProperty({ description: 'Id of role' })
    @IsOptional()
    role?: string;
    @ApiProperty({ description: 'Id of user' })
    @IsOptional()
    manager?: string | null;
    @ApiProperty()
    @IsOptional()
    refreshToken?: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    createdBy?: UserEntity;
    @ApiProperty()
    @IsString()
    @IsOptional()
    updatedBy?: UserEntity;
}

export class PartialCreateUserDto extends PartialType(
    OmitType(CreateUserDto, ['createdBy', 'updatedBy', 'refreshToken'] as const)
) { }

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, [])) { }

