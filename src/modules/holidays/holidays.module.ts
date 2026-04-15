import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayEntity } from 'src/database/postgres/entities/holiday.entity';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './services/holidays.service';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([HolidayEntity])],
    controllers: [HolidaysController],
    providers: [HolidaysService],
    exports: [HolidaysService],
})
export class HolidaysModule { }
