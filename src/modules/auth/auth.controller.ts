import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './service/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { RegisterUserDto } from './dto/register-user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtParserPipe } from 'src/pipes/jwt-parser.pipe';
import { ParseEmailPipe } from 'src/pipes/parse-email.pipe';
import { PasswordValidationPipe } from 'src/pipes/password-validation.pipe';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { PartialCreateUserDto } from '../users/dto/user.dto';
import { UpdateUserDto } from '../users/dto/user.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
    @Post()
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    registerUser(
        @Body() registerUserDto: RegisterUserDto,
        @Body('email', ParseEmailPipe) email: string,
        @Body('password', PasswordValidationPipe) password: string
    ): Promise<any> {
        return this.authService.userService.create(registerUserDto);
    }
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ type: LoginUserDto })
    @ApiResponseWrapper(AuthResponseDto)
    @Post('login')
    async loginUser(
        @Body() loginUserDto: LoginUserDto,
        @Body('email', ParseEmailPipe) email: string,
        @Body('password', PasswordValidationPipe) password: string

    ): Promise<AuthResponseDto> {
        return this.authService.signIn(loginUserDto)
    }
    @ApiOperation({ summary: 'Verify user' })
    @ApiResponseWrapper(class { })
    @Put('verify/:token')
    async verifyUser(
        @Param('token', JwtParserPipe) decoded: any,
        @Body('password', PasswordValidationPipe) password: string,
        @Body('confirmPassword', PasswordValidationPipe) confirmPassword: string
    ): Promise<any> {
        if (password !== confirmPassword)
            return new BadRequestException('Password and confirm password not match');
        return this.authService.verify(decoded, password)
    }
    @ApiOperation({ summary: 'Forgot password' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponseWrapper(class { })
    @Post('forgot-password')
    async forgotPassword(@Body('email', ParseEmailPipe) email: string): Promise<any> {
        return this.authService.forgotPassword(email)
    }
    @ApiOperation({ summary: 'Reset password' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponseWrapper(UserEntity)
    @Put('reset-password/:token')
    async resetUserPassword(
        @Param('token', JwtParserPipe) decoded: any,
        @Body('password', PasswordValidationPipe) password: string,
        @Body('confirmPassword', PasswordValidationPipe) confirmPassword: string
    ): Promise<any> {
        if (password !== confirmPassword)
            return new BadRequestException('Password and confirm password not match');
        return this.authService.resetPassword(decoded, password)
    }
    @ApiOperation({ summary: 'Get logged user detail' })
    @ApiResponseWrapper(UserEntity)
    @ApiBearerAuth()
    @Get()
    getLoggedUser(@Req() req: Request): Promise<UserEntity | any> {
        return this.authService.userService.findById(req['user'].id);
    }
    @ApiOperation({ summary: 'Refresh token', description: 'Need to pass refresh token in Authorization' })
    @ApiBearerAuth()
    @ApiResponseWrapper(AuthResponseDto)
    @UseGuards(AuthGuard('jwt-refresh'))
    @Get('refresh')
    refresh(@Req() req: Request): Promise<any> {
        // console.log(req['user'])
        return this.authService.refreshTokens(req['user'].sub, req['user'].refreshToken);
    }
    @ApiOperation({ summary: 'Update logged user' })
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    @ApiBearerAuth()
    @Put()
    async updateUser(@Req() req: Request, @Body() updateUserDto: UpdateUserDto): Promise<any> {
        return this.authService.userService.update(req['user'].id, updateUserDto, req['user'])
    }
}
