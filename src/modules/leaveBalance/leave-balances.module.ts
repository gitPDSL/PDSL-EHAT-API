import { Module } from '@nestjs/common';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalanceService } from './services/leave-balance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveBalanceEntity, LeaveEntity])],
    controllers: [LeaveBalancesController],
    providers: [LeaveBalanceService],
    exports: [LeaveBalanceService]
})
export class LeaveBalancesModule {
}
