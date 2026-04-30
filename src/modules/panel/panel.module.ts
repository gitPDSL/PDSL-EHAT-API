import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';
import { CorrectionRequestEntity } from 'src/database/postgres/entities/correction-request.entity';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, TimesheetEntity, LeaveEntity, CorrectionRequestEntity])],
    controllers: [PanelController],
    providers: [PanelService],
})
export class PanelModule { }
