import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModuleOptions, MongooseOptionsFactory } from "@nestjs/mongoose";

@Injectable()
export class MongoService implements MongooseOptionsFactory {
    constructor(private readonly configService: ConfigService) {

    }
    createMongooseOptions(): Promise<MongooseModuleOptions> | MongooseModuleOptions {
        const user = this.configService.get<string>('DATABASE.USER');
        const pass = this.configService.get<string>('DATABASE.PASSWORD');
        const host = this.configService.get<string>('DATABASE.HOST');
        const port = this.configService.get<string>('DATABASE.PORT');
        const dbName = this.configService.get<string>('DATABASE.NAME');
        const uri = `mongodb://${user ? user + ':' + pass + '@' : ''}${host}:${port}/${dbName}`;
        // console.log(`Connecting to MongoDB at ${uri}`);
        return { uri };
    }
}