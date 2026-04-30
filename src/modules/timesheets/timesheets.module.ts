import { Module } from '@nestjs/common';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetService } from './services/timesheet.service';
import { TimesheetCronService } from './services/timesheet-cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { CorrectionRequestEntity } from 'src/database/postgres/entities/correction-request.entity';
import { TimesheetApprovalGuard } from './guards/timesheet-approval.guard';
import { PayrollModule } from '../payroll/payroll.module';
@Module({
    imports: [TypeOrmModule.forFeature([TimesheetEntity, UserEntity, ProjectEntity, CorrectionRequestEntity]), PayrollModule],
    controllers: [TimesheetsController],
    providers: [TimesheetService, TimesheetApprovalGuard, TimesheetCronService],
    exports: [TimesheetService]
})
export class TimesheetsModule {
}
