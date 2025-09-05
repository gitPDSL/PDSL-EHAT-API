import { Module } from '@nestjs/common';
import { ProjectUsersController } from './project-users.controller';
import { ProjectUserService } from './services/project-user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';
@Module({
    imports: [TypeOrmModule.forFeature([ProjectUserEntity])],
    controllers: [ProjectUsersController],
    providers: [ProjectUserService],
    exports: [ProjectUserService]
})
export class ProjectUsersModule {
}
