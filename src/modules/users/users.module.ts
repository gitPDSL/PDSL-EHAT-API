import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [UsersController],
    providers: [UserService],
    exports: [UserService]
})
export class UsersModule {
}
