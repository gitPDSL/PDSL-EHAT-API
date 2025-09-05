import { DynamicModule, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";


@Module({
    imports: [],
    exports: []
})
export class PostgresModule {
    static forRootAsync(): DynamicModule {
        return {
            module: PostgresModule,
            imports: [
                TypeOrmModule.forRootAsync({
                    useFactory: async (configService: ConfigService) => {
                        return {
                            type: 'postgres',
                            host: configService.get('DATABASE_HOST'),
                            port: 5432,
                            username: configService.get('DATABASE_USER'),
                            password: configService.get('DATABASE_PASSWORD'),
                            database: configService.get('DATABASE_NAME'),
                            entities: [__dirname + '/**/*.entity{.ts,.js}'],
                            synchronize: true, // use false in production
                        }
                    },
                    inject: [ConfigService]

                }),
            ]
        }
    }
}