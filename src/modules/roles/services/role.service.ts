import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from 'src/database/postgres/entities/role.entity';
import { Repository } from 'typeorm';
import { UpdateRoleDto } from '../dto/role.dto';
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
                roleData['createdBy'] = currentUser;
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
    async findAll(query: Record<string, any> = {}) {
        try {
            const { page, limit, sortBy, order, relations, select, ...filter } = query;
            const sortOrder = {};
            if (sortBy)
                sortOrder[sortBy] = order;
            const roles = page ? await this.roleRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select:select?._value||select }) : await this.roleRepository.find({ where: filter, relations: relations || [], select:select?._value||select });
            return roles;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const role = await this.roleRepository.findOne({ where: { id }, relations });
            return role;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Record<string, any>) {
        try {
            const { relations, ...filter } = query;
            const role = await this.roleRepository.findOne({ where: filter, relations: relations || [] });
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
