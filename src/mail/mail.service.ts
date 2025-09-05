import { Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService implements OnModuleInit {
    constructor(
        private readonly mailerService: MailerService,
        private configService: ConfigService
    ) { }
    async onModuleInit() {
        console.log('Testing SMTP connection...');
        try {
            await this.mailerService.verifyAllTransporters();
            console.log('✅ SMTP server is ready');

        } catch (error) {
            console.log('❌ SMTP connection failed:', error);
        }
    }
    async sendHtmlEmail(to: string, subject: string, htmlContent: string) {
        await this.mailerService.sendMail({
            to,
            subject,
            html: htmlContent,
        });
    }
    async sendAccountVerification(to: string, name: string, link: string) {
        return this.mailerService.sendMail({
            to,
            subject: 'Verify your account',
            template: 'verification', // hbs
            context: { name, verifyLink: link, appName: this.configService.get('APP_NAME') },
        });
    }
    async sendForgotPassword(to: string, name: string, link: string) {
        return this.mailerService.sendMail({
            to,
            subject: 'Reset Your Password',
            template: 'forgot-password', // hbs
            context: { name, resetLink: link, appName: this.configService.get('APP_NAME') },
        });
    }
}
