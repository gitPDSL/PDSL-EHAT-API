import { Module } from '@nestjs/common';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetService } from './services/timesheet.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { TimesheetApprovalGuard } from './guards/timesheet-approval.guard';
@Module({
    imports: [TypeOrmModule.forFeature([TimesheetEntity])],
    controllers: [TimesheetsController],
    providers: [TimesheetService, TimesheetApprovalGuard],
    exports: [TimesheetService]
})
export class TimesheetsModule {
}
