import { Body, Controller, Delete, Get, Ip, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ClientService } from './services/client.service';
import { Request } from 'express';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientDto, PartialCreateClientDto } from './dto/create-client.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { ClientEntity } from 'src/database/postgres/entities/client.entity';

// @Controller({ path: 'clients', host: ':api.example.com' }) get dynamic host with @PostParams()
@Controller('clients')
export class ClientsController {
    constructor(
        private clientService: ClientService
    ) { }
    @ApiOperation({ summary: 'Create a new client' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateClientDto })
    @ApiResponseWrapper(ClientEntity)
    @Post()
    create(@Req() req: Request, @Body() createClientDto: CreateClientDto, @Ip() ip: string): Promise<any> {
        return this.clientService.create(createClientDto, req['user']);
    }
    @ApiOperation({ summary: 'Get clients' })
    @ApiBearerAuth()
    @ApiResponseWrapper(ClientEntity, true)
    @Get()
    getAll(@Query() query: any): Promise<any> {
        return this.clientService.findAll(query);
    }
    @ApiOperation({ summary: 'Get client' })
    @ApiBearerAuth()
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.clientService.findById(id);
    }

    @ApiOperation({ summary: 'Update client' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateClientDto })
    @ApiResponseWrapper(ClientEntity)
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() updateClientDto: UpdateClientDto, @Ip() ip: string): Promise<any> {
        return this.clientService.update(id, updateClientDto, req['user']);
    }
    @ApiOperation({ summary: 'Delete client' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.clientService.remove(id);
    }
}
