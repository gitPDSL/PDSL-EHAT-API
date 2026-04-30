import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { DailyAllocationEntity } from 'src/database/postgres/entities/daily-allocation.entity';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, TimesheetEntity, ProjectEntity, DailyAllocationEntity])],
    controllers: [DashboardsController],
    providers: [DashboardsService],
})
export class DashboardsModule { }
