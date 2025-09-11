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
    async findAll(query: any = {}) {
        try {
            const clients = await this.clientRepository.find(query);
            return clients;
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
            const client = await this.clientRepository.findOneBy({ id });
            return client;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const client = await this.clientRepository.findOne({ where: query });
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
