import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { LeaveBalanceService } from './leave-balance.service';

@Injectable()
export class LeaveBalanceCronService {
    private readonly logger = new Logger(LeaveBalanceCronService.name);

    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private readonly leaveBalanceService: LeaveBalanceService,
    ) { }

    // Jan 1 at 00:00 server time (Europe/London after Group E)
    @Cron('0 0 1 1 *')
    async resetAnnualBalances(): Promise<void> {
        const year = new Date().getFullYear();
        this.logger.log(`Annual leave reset starting for year ${year}`);
        const users = await this.userRepository.find();
        let totalProvisioned = 0;
        for (const user of users) {
            try {
                totalProvisioned += await this.leaveBalanceService.provisionForUser(user.id, year);
            } catch (error) {
                this.logger.error(
                    `Failed to provision leave balances for user ${user.id}: ${error?.message ?? error}`,
                    error?.stack,
                );
            }
        }
        this.logger.log(`Annual leave reset complete: provisioned ${totalProvisioned} balance rows for year ${year}`);
    }
}
