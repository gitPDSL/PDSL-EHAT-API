import { Global, Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectService } from './services/project.service';
import { ProjectCapacityService } from './services/project-capacity.service';
import { ProjectCapCronService } from './services/project-cap-cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';
import { ProjectUsersModule } from '../projectUsers/project-users.module';
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ProjectEntity, TimesheetEntity, ProjectUserEntity]), ProjectUsersModule],
    controllers: [ProjectsController],
    providers: [ProjectService, ProjectCapacityService, ProjectCapCronService],
    exports: [ProjectService, ProjectCapacityService]
})
export class ProjectsModule {
}
