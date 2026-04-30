import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsController } from './exports.controller';
import { ExportsService } from './services/exports.service';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { LeaveBalanceEntity } from 'src/database/postgres/entities/leave-balance.entity';
import { AuditLogEntity } from 'src/database/postgres/entities/audit-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TimesheetEntity, LeaveEntity, LeaveBalanceEntity, AuditLogEntity])],
    controllers: [ExportsController],
    providers: [ExportsService],
})
export class ExportsModule { }
