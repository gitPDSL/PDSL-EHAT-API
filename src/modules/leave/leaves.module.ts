import { Module } from '@nestjs/common';
import { LeavesController } from './leaves.controller';
import { LeaveService } from './services/leave.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { DailyAllocationEntity } from 'src/database/postgres/entities/daily-allocation.entity';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveEntity, DailyAllocationEntity])],
    controllers: [LeavesController],
    providers: [LeaveService],
    exports: [LeaveService]
})
export class LeavesModule {
}
