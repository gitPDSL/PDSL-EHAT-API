import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyAllocationEntity } from 'src/database/postgres/entities/daily-allocation.entity';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';

@Module({
    imports: [TypeOrmModule.forFeature([DailyAllocationEntity])],
    controllers: [AllocationsController],
    providers: [AllocationsService],
    exports: [AllocationsService],
})
export class AllocationsModule { }
