import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorrectionRequestEntity } from 'src/database/postgres/entities/correction-request.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { CorrectionsController } from './corrections.controller';
import { CorrectionsService } from './corrections.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([CorrectionRequestEntity, TimesheetEntity, UserEntity]),
    ],
    controllers: [CorrectionsController],
    providers: [CorrectionsService],
    exports: [CorrectionsService],
})
export class CorrectionsModule { }
