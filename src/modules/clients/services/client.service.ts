import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientEntity } from 'src/database/postgres/entities/client.entity';
import { Repository } from 'typeorm';
import { UpdateClientDto } from '../dto/client.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class ClientService {
    constructor(
        @InjectRepository(ClientEntity) private readonly clientRepository: Repository<ClientEntity>
    ) {
    }
    async create(clientData: Partial<ClientEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                clientData['updatedBy'] = currentUser;
            }
            const client = await this.clientRepository.save(await this.clientRepository.create(clientData))
            return client;
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
    async update(id: string, clientData: Partial<UpdateClientDto>, currentUser: UserEntity | null = null) {
        try {
            let client = await this.clientRepository.findOne({ where: { id } }) || {};
            Object.keys(clientData).map(key => {
                client[key] = clientData[key];
            });
            if (currentUser && currentUser.id) {
                client['updatedBy'] = currentUser;
            }
            await this.clientRepository.save(client);
            // console.log('update client', client)
            return client;
        } catch (error) {
            console.log('error-----', error, clientData)
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
            const clients = page ? await this.clientRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select:select?._value||select }) : await this.clientRepository.find({ where: filter, relations: relations || [], select:select?._value||select });
            return clients;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const client = await this.clientRepository.findOne({ where: { id }, relations });
            return client;
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
            const client = await this.clientRepository.findOne({ where: filter, relations: relations || [] });
            return client;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const client = await this.clientRepository.delete(id);
            return client;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
