import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectService } from './services/project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { ProjectUsersModule } from '../projectUsers/project-users.module';
@Module({
    imports: [TypeOrmModule.forFeature([ProjectEntity]), ProjectUsersModule],
    controllers: [ProjectsController],
    providers: [ProjectService],
    exports: [ProjectService]
})
export class ProjectsModule {
}
