import { Module } from '@nestjs/common';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalanceService } from './services/leave-balance.service';
import { LeaveBalanceCronService } from './services/leave-balance-cron.service';
import { LeaveAccrualService } from './services/leave-accrual.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { LeaveTypeEntity } from 'src/database/postgres/entities/leave-type.entity';
import { LeaveAccrualRuleEntity } from 'src/database/postgres/entities/leave-accrual-rule.entity';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveBalanceEntity, LeaveEntity, LeaveTypeEntity, LeaveAccrualRuleEntity, UserEntity])],
    controllers: [LeaveBalancesController],
    providers: [LeaveBalanceService, LeaveBalanceCronService, LeaveAccrualService],
    exports: [LeaveBalanceService]
})
export class LeaveBalancesModule {
}
