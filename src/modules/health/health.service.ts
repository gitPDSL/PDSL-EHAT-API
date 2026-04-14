import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';

type CheckResult = { status: 'up' | 'down'; reason?: string };

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly mailerService: MailerService,
    ) { }

    liveness() {
        return { status: 'ok' };
    }

    async readiness() {
        const [db, smtp] = await Promise.all([this.checkDatabase(), this.checkSmtp()]);
        const overall = db.status === 'up' && smtp.status === 'up' ? 'ok' : 'degraded';
        const body = { status: overall, checks: { database: db, smtp } };
        if (overall !== 'ok') {
            throw new ServiceUnavailableException(body);
        }
        return body;
    }

    private async checkDatabase(): Promise<CheckResult> {
        try {
            await this.dataSource.query('SELECT 1');
            return { status: 'up' };
        } catch (error) {
            this.logger.error(`Database check failed: ${error?.message ?? error}`, error?.stack);
            return { status: 'down', reason: error?.message ?? 'unknown' };
        }
    }

    private async checkSmtp(): Promise<CheckResult> {
        try {
            await this.mailerService.verifyAllTransporters();
            return { status: 'up' };
        } catch (error) {
            this.logger.error(`SMTP check failed: ${error?.message ?? error}`, error?.stack);
            return { status: 'down', reason: error?.message ?? 'unknown' };
        }
    }
}
