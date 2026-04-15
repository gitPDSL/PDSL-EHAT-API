import { Body, Controller, Delete, ForbiddenException, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { UserService } from './services/user.service';
import { Request } from 'express';
import { CreateUserDto, PartialCreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { ParseEmailPipe, ParseOptionalEmailPipe } from 'src/pipes/parse-email.pipe';
import { OptionalPasswordValidationPipe } from 'src/pipes/password-validation.pipe';
import { In } from 'typeorm';
import { QueryTransformTypeorm } from 'src/utills/common.utill';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('users')
export class UsersController {
    constructor(
        private userService: UserService,
    ) { }
    @ApiOperation({ summary: 'Create a new user (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    @Roles('ADMIN')
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
    getAll(@Query() query: Record<string, any>): Promise<any> {
        query = QueryTransformTypeorm(query);

        if (!query.relations)
            query.relations = ['department', 'role', 'manager']

        return this.userService.findAll(query);
    }
    @ApiOperation({ summary: 'Get user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(UserEntity)
    @Get(':id')
    get(@Query() query: Record<string, any> = {}, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        if (query.relations)
            query.relations = query.relations.split(',').filter(a => a);
        return this.userService.findById(id, false, query.relations || []);
    }
    @Roles('ADMIN')
    @Put('bulk-update')
    async bulkUpdate(
        @Req() req: Request,
        @Body() updateUserDto: UpdateUserDto,
        @Query() query: Record<string, any> = {}
    ): Promise<any> {
        if (query.id) {
            query.id = query.id.split(',');
            query.id = In(query.id);
        }
        return this.userService.bulkUpdate(query, updateUserDto, req['user']);
    }

    @ApiOperation({ summary: 'Update user (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateUserDto })
    @ApiResponseWrapper(UserEntity)
    @Roles('ADMIN')
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


    @ApiOperation({ summary: 'Soft delete user (admin only). Sets deleted_at and leaves timesheets and project assignments intact for historical reporting.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Delete(':id')
    async delete(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.userService.remove(id, req['user']);
    }

    @ApiOperation({ summary: 'Resend the account verification email (admin only). Use when a user is stuck in PENDING and the original verification email was lost or bounced.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Post(':id/resend-verification')
    resendVerification(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.userService.resendVerification(id, req['user']);
    }

    @ApiOperation({ summary: 'Force-verify a user (admin only). Bypasses the email flow and flips status to ACTIVE. Intended for use when SMTP is down and a user is stuck in PENDING.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Post(':id/force-verify')
    forceVerify(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.userService.forceVerify(id, req['user']);
    }

    @ApiOperation({ summary: 'GDPR data export. Admin can export any user; any authenticated user can export their own record. Bundles the user row (passwordHash and refreshToken stripped), timesheets, leaves, and related audit log entries as JSON.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Get(':id/data-export')
    async dataExport(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        const caller = req['user'];
        const isAdmin = caller?.role?.id === 'ADMIN';
        const isSelf = caller?.id === id;
        if (!isAdmin && !isSelf) {
            throw new ForbiddenException('You can only export your own user data');
        }
        return this.userService.dataExport(id);
    }

    @ApiOperation({ summary: 'GDPR erasure (admin only). Anonymizes the user in place: fullName is set to [erased], email and credentials are cleared, and the row is soft-deleted. Historical timesheet and audit rows are preserved for accounting and legal record-keeping.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Delete(':id/erase')
    async erase(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.userService.erase(id, req['user']);
    }
}
