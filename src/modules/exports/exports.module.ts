import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsController } from './exports.controller';
import { ExportsService } from './services/exports.service';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ClientEntity } from 'src/database/postgres/entities/client.entity';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TimesheetEntity, ClientEntity, ProjectUserEntity])],
    controllers: [ExportsController],
    providers: [ExportsService],
})
export class ExportsModule { }
