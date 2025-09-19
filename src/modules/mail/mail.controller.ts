import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { MailService } from 'src/mail/mail.service';
import { MailDto, PartialMailDto } from './dto/mail.dto';
import { ParseEmailPipe } from 'src/pipes/parse-email.pipe';
// @Controller({ path: 'roles', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('mail')
export class MailController {
    constructor(
        private mailService: MailService,
    ) { }
    @ApiOperation({ summary: 'Send a test mail' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialMailDto })
    @Post()
    create(
        @Req() req: Request,
        @Body('to', ParseEmailPipe) email: string,
        @Body() mailDto: MailDto
    ): Promise<any> {
        return this.mailService.sendEmail(mailDto.to, mailDto.subject, mailDto.message)
    }
}
