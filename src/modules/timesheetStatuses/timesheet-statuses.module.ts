import { Module } from '@nestjs/common';
import { TimesheetStatusesController } from './timesheet-statuses.controller';
import { TimesheetStatusService } from './services/timesheet-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetStatusEntity } from 'src/database/postgres/entities/timesheet-status.entity';
@Module({
    imports: [TypeOrmModule.forFeature([TimesheetStatusEntity])],
    controllers: [TimesheetStatusesController],
    providers: [TimesheetStatusService],
    exports: [TimesheetStatusService]
})
export class TimesheetStatusesModule {
}
