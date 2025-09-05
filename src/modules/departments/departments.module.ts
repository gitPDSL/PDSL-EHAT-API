import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentService } from './services/department.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from 'src/database/postgres/entities/department.entity';
@Module({
    imports: [TypeOrmModule.forFeature([DepartmentEntity])],
    controllers: [DepartmentsController],
    providers: [DepartmentService],
    exports: [DepartmentService]
})
export class DepartmentsModule {
}
