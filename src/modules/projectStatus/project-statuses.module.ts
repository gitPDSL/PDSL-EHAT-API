import { Module } from '@nestjs/common';
import { ProjectStatusesController } from './project-statuses.controller';
import { ProjectStatusService } from './services/project-status.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectStatusEntity } from 'src/database/postgres/entities/project-status.entity';
@Module({
    imports: [TypeOrmModule.forFeature([ProjectStatusEntity])],
    controllers: [ProjectStatusesController],
    providers: [ProjectStatusService],
    exports: [ProjectStatusService]
})
export class ProjectStatusesModule {
}
