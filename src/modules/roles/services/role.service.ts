import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from 'src/database/postgres/entities/role.entity';
import { Repository } from 'typeorm';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>
    ) {
    }
    async create(roleData: Partial<RoleEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                roleData['updatedBy'] = currentUser;
            }
            const role = await this.roleRepository.save(await this.roleRepository.create(roleData))
            return role;
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
    async update(id: string, roleData: Partial<UpdateRoleDto>, currentUser: UserEntity | null = null) {
        try {
            let role = await this.roleRepository.findOne({ where: { id } }) || {};
            Object.keys(roleData).map(key => {
                role[key] = roleData[key];
            });
            if (currentUser && currentUser.id) {
                role['updatedBy'] = currentUser;
            }
            await this.roleRepository.save(role);
            // console.log('update role', role)
            return role;
        } catch (error) {
            console.log('error-----', error, roleData)
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: any = {}) {
        try {
            const roles = await this.roleRepository.find(query);
            return roles;
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
            const role = await this.roleRepository.findOneBy({ id });
            return role;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const role = await this.roleRepository.findOne({ where: query });
            return role;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const role = await this.roleRepository.delete(id);
            return role;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
