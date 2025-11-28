import { Module } from '@nestjs/common';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypeService } from './services/leave-type.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveTypeEntity } from 'src/database/postgres/entities/leave-type.entity';
@Module({
    imports: [TypeOrmModule.forFeature([LeaveTypeEntity])],
    controllers: [LeaveTypesController],
    providers: [LeaveTypeService],
    exports: [LeaveTypeService]
})
export class LeaveTypesModule {
}
