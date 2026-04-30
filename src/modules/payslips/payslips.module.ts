import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayslipDocumentEntity } from 'src/database/postgres/entities/payslip-document.entity';
import { PayrollPeriodEntity } from 'src/database/postgres/entities/payroll-period.entity';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { PayslipsController } from './payslips.controller';
import { PayslipsService } from './payslips.service';

@Module({
    imports: [TypeOrmModule.forFeature([PayslipDocumentEntity, PayrollPeriodEntity, UserEntity])],
    controllers: [PayslipsController],
    providers: [PayslipsService],
})
export class PayslipsModule { }
