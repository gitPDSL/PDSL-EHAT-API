import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { join } from 'path';
import { MailService } from 'src/mail/mail.service';

@Global()
@Module({
    providers: [MailService],
    exports: [MailService]
})
export class MailModule {
    static forRoot(): DynamicModule {
        return {
            module: MailModule,
            imports: [
                MailerModule.forRootAsync({
                    useFactory: async (configService: ConfigService) => {
                        const oauth2Client = new google.auth.OAuth2(
                            configService.get('SMTP_CLIENT_ID'),
                            configService.get('SMTP_CLIENT_SECRET'),
                        );
                        oauth2Client.setCredentials({
                            refresh_token: configService.get('SMTP_REFRESH_TOKEN'),
                        });
                        const accessToken = (await oauth2Client.getAccessToken()).token;

                        return {
                            transport: {
                                service: configService.get('SMTP_SERVICE'),
                                auth: {
                                    type: 'OAuth2',
                                    user: configService.get('SMTP_EMAIL_USER'),
                                    clientId: configService.get('SMTP_CLIENT_ID'),
                                    clientSecret: configService.get('SMTP_CLIENT_SECRET'),
                                    refreshToken: configService.get('SMTP_REFRESH_TOKEN'),
                                    accessToken,        // initial access token
                                },
                            },
                            defaults: {
                                from: `"My App" <${configService.get('NO_REPLY')}>`,
                            },
                            template: {
                                dir: join(__dirname, 'templates'),
                                adapter: new HandlebarsAdapter(),
                                options: {
                                    strict: true,
                                },
                            },
                        };
                    },
                    inject: [ConfigService]
                }),
            ],
        }
    }

}
