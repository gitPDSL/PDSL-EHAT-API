import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollPeriodEntity } from 'src/database/postgres/entities/payroll-period.entity';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './services/payroll.service';

@Module({
    imports: [TypeOrmModule.forFeature([PayrollPeriodEntity])],
    controllers: [PayrollController],
    providers: [PayrollService],
    exports: [PayrollService],
})
export class PayrollModule { }
