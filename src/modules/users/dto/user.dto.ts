import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MinLength, ValidateIf } from "class-validator";
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
    @Matches(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*)(+=._-]).{8,}$/,
        {
            message:
                'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character from !@#$%^&*)(+=._-',
        },
    )
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

    @ApiProperty({ required: false, nullable: true, description: 'User id that approves on this user\'s behalf during the delegate window' })
    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsUUID()
    delegateManagerId?: string | null;

    @ApiProperty({ required: false, nullable: true, description: 'Delegate window start (YYYY-MM-DD)' })
    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsDateString()
    delegateFrom?: string | null;

    @ApiProperty({ required: false, nullable: true, description: 'Delegate window end (YYYY-MM-DD)' })
    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsDateString()
    delegateTo?: string | null;
}

export class PartialCreateUserDto extends PartialType(
    OmitType(CreateUserDto, ['createdBy', 'updatedBy', 'refreshToken'] as const)
) { }

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, [])) { }

