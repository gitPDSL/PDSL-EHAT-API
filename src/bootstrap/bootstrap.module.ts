import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { RoleEntity } from 'src/database/postgres/entities/role.entity';
import { BootstrapAdminService } from './bootstrap-admin.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity])],
    providers: [BootstrapAdminService],
})
export class BootstrapModule { }
