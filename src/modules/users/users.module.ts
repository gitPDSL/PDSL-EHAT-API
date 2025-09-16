import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { TimesheetsModule } from '../timesheets/timesheets.module';
import { ProjectUsersModule } from '../projectUsers/project-users.module';
@Module({
    imports: [TypeOrmModule.forFeature([UserEntity]), TimesheetsModule, ProjectUsersModule],
    controllers: [UsersController],
    providers: [UserService],
    exports: [UserService]
})
export class UsersModule {
}
