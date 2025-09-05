import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DepartmentEntity } from 'src/database/postgres/entities/department.entity';
import { Repository } from 'typeorm';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class DepartmentService {
    constructor(
        @InjectRepository(DepartmentEntity) private readonly departmentRepository: Repository<DepartmentEntity>
    ) {
    }
    async create(departmentData: Partial<DepartmentEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                departmentData['updatedBy'] = currentUser;
            }
            const department = await this.departmentRepository.save(await this.departmentRepository.create(departmentData))
            return department;
        } catch (error) {
            console.log(error);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async update(id: string, departmentData: Partial<UpdateDepartmentDto>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                departmentData['updatedBy'] = currentUser;
            }
            let department = await this.departmentRepository.findOne({ where: { id } }) || {};
            Object.keys(departmentData).map(key => {
                department[key] = departmentData[key];
            })
            await this.departmentRepository.save(department);
            // console.log('update department', department)
            return department;
        } catch (error) {
            console.log('error-----', error, departmentData)
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: any = {}) {
        try {
            const departments = await this.departmentRepository.find(query);
            return departments;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, refreshToken: boolean = false) {
        try {
            // let selectFields: string = 'firstName lastNeme email accountType status createdAt updatedAt' + (refreshToken ? ' refreshToken' : '');
            const department = await this.departmentRepository.findOneBy({ id });
            return department;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const department = await this.departmentRepository.findOne({ where: query });
            return department;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const department = await this.departmentRepository.delete(id);
            return department;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
