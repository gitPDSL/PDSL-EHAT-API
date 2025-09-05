import { ApiProperty } from "@nestjs/swagger";
import { MinLength } from "class-validator";
import { MatchDecorator } from "src/decorators/match.decorator";

export class ResetPasswordDto {
    @ApiProperty()
    @MinLength(8)
    password: string;
    @ApiProperty()
    @MinLength(8)
    @MatchDecorator('password', { message: 'Passwords do not match' })
    confirmPassword: string;
}