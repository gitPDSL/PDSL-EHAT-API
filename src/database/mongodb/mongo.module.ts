import { Module } from "@nestjs/common";
import { MongoService } from "./mongo.service";
import { MongooseModule } from "@nestjs/mongoose";
import { SchemasModule } from './schemas.module';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useClass: MongoService
        }),
        SchemasModule
    ],
    exports: [MongooseModule]
})
export class MongoModule {

}