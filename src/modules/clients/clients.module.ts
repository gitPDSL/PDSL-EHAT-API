import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientService } from './services/client.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from 'src/database/postgres/entities/client.entity';
@Module({
    imports: [TypeOrmModule.forFeature([ClientEntity])],
    controllers: [ClientsController],
    providers: [ClientService],
    exports: [ClientService]
})
export class ClientsModule {
}
