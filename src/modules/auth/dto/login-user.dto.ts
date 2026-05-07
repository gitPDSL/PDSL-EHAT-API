import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MinLength } from "class-validator";

export class LoginUserDto {
    @ApiProperty({ description: 'Email address or username.' })
    @IsNotEmpty()
    email: string;
    @ApiProperty()
    @MinLength(8)
    password: string;
}