import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { OtpService } from './services/otp.service';
import { Request } from 'express';
import { CreateOtpDto, PartialCreateOtpDto, UpdateOtpDto } from './dto/otp.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { OtpEntity } from 'src/database/postgres/entities/otp.entity';
// @Controller({ path: 'otps', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('otp')
export class OtpsController {
    constructor(
        private otpService: OtpService
    ) { }
    @ApiOperation({ summary: 'Create a new otp' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateOtpDto })
    @ApiResponseWrapper(OtpEntity)
    @Post()
    create(@Req() req: Request, @Body() createOtpDto: CreateOtpDto, @Ip() ip: string): Promise<any> {
        return this.otpService.create(createOtpDto, req['user']);
    }
    @ApiOperation({ summary: 'Get otps' })
    @ApiBearerAuth()
    @ApiResponseWrapper(OtpEntity, true)
    @Get()
    getAll(@Query() query: any): Promise<any> {
        return this.otpService.findAll(query);
    }
    @ApiOperation({ summary: 'Get otp' })
    @ApiBearerAuth()
    @ApiResponseWrapper(OtpEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.otpService.findById(id);
    }

    @ApiOperation({ summary: 'Update otp' })
    @ApiBearerAuth()
    @Put(':id')
    @ApiBody({ type: PartialCreateOtpDto })
    @ApiResponseWrapper(OtpEntity)
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateOtpDto: UpdateOtpDto, @Ip() ip: string): Promise<any> {
        return this.otpService.update(id, updateOtpDto, req['user']);
    }

    @ApiOperation({ summary: 'Delete otp' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.otpService.remove(id);
    }
}
