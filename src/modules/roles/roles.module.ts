import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RoleService } from './services/role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from 'src/database/postgres/entities/role.entity';
@Module({
    imports: [TypeOrmModule.forFeature([RoleEntity])],
    controllers: [RolesController],
    providers: [RoleService],
    exports: [RoleService]
})
export class RolesModule {
}
