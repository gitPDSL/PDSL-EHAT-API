import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { join } from 'path';
import { MailService } from 'src/mail/mail.service';

const moduleLogger = new Logger('MailModule');

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
                        const clientId = configService.get<string>('SMTP_CLIENT_ID');
                        const clientSecret = configService.get<string>('SMTP_CLIENT_SECRET');
                        const refreshToken = configService.get<string>('SMTP_REFRESH_TOKEN');
                        const user = configService.get<string>('SMTP_EMAIL_USER');
                        const fromAddress = configService.get<string>('NO_REPLY') ?? user ?? 'noreply@example.com';
                        const baseConfig = {
                            defaults: {
                                from: `"eHAT" <${fromAddress}>`,
                            },
                            template: {
                                dir: join(__dirname, 'templates'),
                                adapter: new HandlebarsAdapter(),
                                options: { strict: false },
                            },
                        };

                        const credsLooksReal = clientId && clientSecret && refreshToken && user
                            && !/^(demo|placeholder|changeme|todo)$/i.test(refreshToken);
                        if (!credsLooksReal) {
                            moduleLogger.warn(
                                'SMTP credentials are missing or look like placeholders. Outbound email is disabled (jsonTransport). Fill in SMTP_CLIENT_ID / SMTP_CLIENT_SECRET / SMTP_REFRESH_TOKEN / SMTP_EMAIL_USER to enable real sending.',
                            );
                            return {
                                ...baseConfig,
                                transport: { jsonTransport: true },
                            };
                        }

                        try {
                            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
                            oauth2Client.setCredentials({ refresh_token: refreshToken });
                            const accessToken = (await oauth2Client.getAccessToken()).token;
                            return {
                                ...baseConfig,
                                transport: {
                                    service: configService.get('SMTP_SERVICE'),
                                    auth: {
                                        type: 'OAuth2',
                                        user,
                                        clientId,
                                        clientSecret,
                                        refreshToken,
                                        accessToken,
                                    },
                                },
                            };
                        } catch (error: any) {
                            moduleLogger.error(
                                `Gmail OAuth2 setup failed: ${error?.message ?? error}. Falling back to jsonTransport so the app can still boot.`,
                            );
                            return {
                                ...baseConfig,
                                transport: { jsonTransport: true },
                            };
                        }
                    },
                    inject: [ConfigService]
                }),
            ],
        }
    }

}
