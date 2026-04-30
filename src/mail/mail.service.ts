import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService implements OnModuleInit {
    private readonly logger = new Logger(MailService.name);
    constructor(
        private readonly mailerService: MailerService,
        private configService: ConfigService
    ) { }
    async onModuleInit() {
        this.logger.log('Testing SMTP connection...');
        try {
            await this.mailerService.verifyAllTransporters();
            this.logger.log('SMTP server is ready');

        } catch (error) {
            this.logger.error(`SMTP connection failed: ${error?.message ?? error}`, error?.stack);
        }
    }

    /**
     * Best-effort send with exponential backoff. Does not throw on final failure;
     * callers should not be blocked by email delivery errors.
     */
    async sendWithRetry(options: ISendMailOptions, maxAttempts: number = 3): Promise<void> {
        let lastError: any;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.mailerService.sendMail(options);
                return;
            } catch (error) {
                lastError = error;
                this.logger.warn(
                    `Email send attempt ${attempt}/${maxAttempts} to ${options.to} failed: ${error?.message ?? error}`,
                );
                if (attempt < maxAttempts) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    await new Promise((resolve) => setTimeout(resolve, backoffMs));
                }
            }
        }
        this.logger.error(
            `Email send exhausted all ${maxAttempts} attempts for ${options.to}: ${lastError?.message ?? lastError}`,
            lastError?.stack,
        );
    }

    async sendEmail(to: string, subject: string = 'Test email', text: string = 'Test email') {
        return this.mailerService.sendMail({
            to,
            subject,
            template: 'general',
            context: { message: text, appName: this.configService.get('APP_NAME') }
        });
    }
    async sendHtmlEmail(to: string, subject: string, text: string = '', htmlContent: string = '') {
        return this.mailerService.sendMail({
            to,
            subject,
            text,
            html: htmlContent,
        });
    }

    /**
     * Generic transactional email using the shared "general" template.
     * Suitable for one-off operational alerts (e.g. project cap thresholds)
     * that don't deserve their own template.
     */
    async sendGeneric(
        to: string,
        subject: string,
        message: string,
        extras: { recipientName?: string; link?: string } = {},
    ) {
        await this.sendWithRetry({
            to,
            subject,
            template: 'general',
            context: {
                appName: this.configService.get('APP_NAME'),
                name: extras.recipientName ?? 'there',
                message,
                link: extras.link ?? '',
            },
        });
    }
    async sendAccountVerification(to: string, name: string, link: string, webUrl: string) {
        return this.mailerService.sendMail({
            to,
            subject: 'Verify your account',
            template: 'verification', // hbs
            context: { name, verifyLink: link, appName: this.configService.get('APP_NAME'), webUrl },
        });
    }
    async sendForgotPassword(to: string, name: string, link: string, webUrl: string) {
        return this.mailerService.sendMail({
            to,
            subject: 'Reset Your Password',
            template: 'forgot-password', // hbs
            context: { name, resetLink: link, appName: this.configService.get('APP_NAME'), webUrl },
        });
    }

    async sendTimesheetSubmitted(to: string, managerName: string, employeeName: string, weekNumber: number, year: number, link: string) {
        await this.sendWithRetry({
            to,
            subject: `${employeeName} submitted a timesheet for week ${weekNumber}`,
            template: 'timesheet-submitted',
            context: {
                managerName,
                employeeName,
                weekNumber,
                year,
                link,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendTimesheetApproved(to: string, employeeName: string, approverName: string, weekNumber: number, year: number) {
        await this.sendWithRetry({
            to,
            subject: `Your timesheet for week ${weekNumber} was approved`,
            template: 'timesheet-approved',
            context: {
                employeeName,
                approverName,
                weekNumber,
                year,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendTimesheetRejected(to: string, employeeName: string, rejecterName: string, weekNumber: number, year: number, reason: string, link: string) {
        await this.sendWithRetry({
            to,
            subject: `Your timesheet for week ${weekNumber} was rejected`,
            template: 'timesheet-rejected',
            context: {
                employeeName,
                rejecterName,
                weekNumber,
                year,
                reason,
                link,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendLeaveSubmitted(to: string, managerName: string, employeeName: string, leaveTypeName: string, startDate: string, endDate: string, link: string) {
        await this.sendWithRetry({
            to,
            subject: `${employeeName} submitted a ${leaveTypeName} leave request`,
            template: 'leave-submitted',
            context: {
                managerName,
                employeeName,
                leaveTypeName,
                startDate,
                endDate,
                link,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendLeaveApproved(to: string, employeeName: string, leaveTypeName: string, startDate: string, endDate: string) {
        await this.sendWithRetry({
            to,
            subject: `Your ${leaveTypeName} leave request was approved`,
            template: 'leave-approved',
            context: {
                employeeName,
                leaveTypeName,
                startDate,
                endDate,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendLeaveRejected(to: string, employeeName: string, leaveTypeName: string, startDate: string, endDate: string, reason: string | null) {
        await this.sendWithRetry({
            to,
            subject: `Your ${leaveTypeName} leave request was rejected`,
            template: 'leave-rejected',
            context: {
                employeeName,
                leaveTypeName,
                startDate,
                endDate,
                reason: reason ?? '',
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendWeeklyReminder(to: string, employeeName: string, missingDays: string[], link: string) {
        await this.sendWithRetry({
            to,
            subject: 'You still have timesheet entries to submit this week',
            template: 'weekly-reminder',
            context: {
                employeeName,
                missingDays,
                link,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendOverdueEscalation(to: string, managerName: string, rows: Array<{ employeeName: string; weekNumber: number; daysOverdue: number }>, link: string) {
        await this.sendWithRetry({
            to,
            subject: 'Overdue timesheet approvals need your attention',
            template: 'overdue-escalation',
            context: {
                managerName,
                rows,
                link,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }

    async sendManagerDigest(to: string, managerName: string, pendingBreakdown: Array<{ employeeName: string; pendingCount: number }>, totalPending: number, link: string) {
        await this.sendWithRetry({
            to,
            subject: `You have ${totalPending} timesheets awaiting approval`,
            template: 'manager-digest',
            context: {
                managerName,
                pendingBreakdown,
                totalPending,
                link,
                appName: this.configService.get('APP_NAME'),
            },
        });
    }
}
