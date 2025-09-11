import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { UserService } from './services/user.service';
import { Request } from 'express';
import { CreateUserDto, PartialCreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { ParseEmailPipe } from 'src/pipes/parse-email.pipe';
import { PasswordValidationPipe } from 'src/pipes/password-validation.pipe';
// @Controller({ path: 'users', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('users')
export class UsersController {
    constructor(
        private userService: UserService
    ) { }
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    @Post()
    create(
        @Req() req: Request,
        @Body() createUserDto: CreateUserDto,
        @Body('email', ParseEmailPipe) email: string,
        @Body('password', PasswordValidationPipe) password: string,
        @Ip() ip: string
    ): Promise<any> {
        return this.userService.create(createUserDto, req['user']);
    }
    @ApiOperation({ summary: 'Get users' })
    @ApiBearerAuth()
    @ApiResponseWrapper(UserEntity, true)
    @Get()
    getAll(@Query() query: any): Promise<any> {
        return this.userService.findAll(query);
    }
    @ApiOperation({ summary: 'Get user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(UserEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.userService.findById(id);
    }

    @ApiOperation({ summary: 'Update user' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    @Put(':id')
    update(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Body('email', ParseEmailPipe) email: string,
        @Body('password', PasswordValidationPipe) password: string,
        @Body() updateUserDto: UpdateUserDto,
        @Ip() ip: string
    ): Promise<any> {
        return this.userService.update(id, updateUserDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.userService.remove(id);
    }
}
