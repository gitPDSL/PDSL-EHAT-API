import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyAllocationEntity } from 'src/database/postgres/entities/daily-allocation.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';

@Module({
    imports: [TypeOrmModule.forFeature([DailyAllocationEntity, TimesheetEntity])],
    controllers: [AllocationsController],
    providers: [AllocationsService],
    exports: [AllocationsService],
})
export class AllocationsModule { }
