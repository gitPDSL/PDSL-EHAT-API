import { Module } from '@nestjs/common';
import { LeaveStatusesController } from './leave-statuses.controller';
import { LeaveStatusService } from './services/leave-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveStatusEntity } from 'src/database/postgres/entities/leave-status.entity';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveStatusEntity])],
    controllers: [LeaveStatusesController],
    providers: [LeaveStatusService],
    exports: [LeaveStatusService]
})
export class LeaveStatusesModule {
}
