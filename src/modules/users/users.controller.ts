import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { UserService } from './services/user.service';
import { Request } from 'express';
import { CreateUserDto, PartialCreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { ParseEmailPipe, ParseOptionalEmailPipe } from 'src/pipes/parse-email.pipe';
import { OptionalPasswordValidationPipe } from 'src/pipes/password-validation.pipe';
import { In } from 'typeorm';
import { TimesheetService } from '../timesheets/services/timesheet.service';
import { ProjectUserService } from '../projectUsers/services/project-user.service';
@Controller('users')
export class UsersController {
    constructor(
        private userService: UserService,
        private timesheetService: TimesheetService,
        private projectUserService: ProjectUserService,
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
        @Body('password', OptionalPasswordValidationPipe) password: string,
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
    @Put('bulk-update')
    async bulkUpdate(
        @Req() req: Request,
        @Body() updateUserDto: UpdateUserDto,
        @Query() query: any = {}
    ): Promise<any> {
        if (query.id) {
            query.id = query.id.split(',');
            query.id = In(query.id);
        }
        return this.userService.bulkUpdate(query, updateUserDto, req['user']);
    }

    @ApiOperation({ summary: 'Update user' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    @Put(':id')
    update(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Body('email', ParseOptionalEmailPipe) email: string,
        @Body('password', OptionalPasswordValidationPipe) password: string,
        @Body() updateUserDto: UpdateUserDto,
        @Ip() ip: string
    ): Promise<any> {
        return this.userService.update(id, updateUserDto, req['user']);
    }


    @ApiOperation({ summary: 'Delete user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    async delete(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        // console.log('hi-----------------------------------')
        try {
            await this.timesheetService.removeMany({ userId: id });
            await this.projectUserService.removeMany({ userId: id });
        } catch (er) {
            console.error('-=-===-==--===-----', er)
        }
        return this.userService.remove(id, req['user']);
    }
}
