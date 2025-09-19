import { ApiProperty, PartialType, OmitType } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { UserEntity } from "src/database/postgres/entities/user.entity";

export class MailDto {
    @ApiProperty()
    @IsEmail()
    to: string;
    @ApiProperty()
    @IsString()
    subject: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    message?: string;
}

export class PartialMailDto extends PartialType(
    OmitType(MailDto, [] as const)
) { }
