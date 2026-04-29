import { DynamicModule, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";


@Module({
    imports: [],
    exports: []
})
export class PostgresModule {
    private static readonly logger = new Logger(PostgresModule.name);

    static forRootAsync(): DynamicModule {
        return {
            module: PostgresModule,
            imports: [
                TypeOrmModule.forRootAsync({
                    useFactory: async (configService: ConfigService) => {
                        const nodeEnv = configService.get<string>('NODE_ENV');
                        const allowSync = configService.get<string>('TYPEORM_ALLOW_SCHEMA_SYNC') === 'true';
                        if (allowSync && nodeEnv === 'production') {
                            throw new Error(
                                'TYPEORM_ALLOW_SCHEMA_SYNC=true is forbidden when NODE_ENV=production. Run migrations instead.',
                            );
                        }
                        if (allowSync) {
                            PostgresModule.logger.warn(
                                'TYPEORM_ALLOW_SCHEMA_SYNC=true — schema will auto-sync from entities. Dev use only.',
                            );
                        }
                        const useSsl = configService.get<string>('DATABASE_SSL') === 'true';
                        return {
                            type: 'postgres',
                            host: configService.get('DATABASE_HOST'),
                            port: Number(configService.get('DATABASE_PORT') ?? 5432),
                            username: configService.get('DATABASE_USER'),
                            password: configService.get('DATABASE_PASSWORD'),
                            database: configService.get('DATABASE_NAME'),
                            entities: [__dirname + '/**/*.entity{.ts,.js}'],
                            migrations: [__dirname + '/migrations/*{.ts,.js}'],
                            migrationsRun: nodeEnv === 'production',
                            synchronize: allowSync,
                            retryAttempts: nodeEnv === 'test' ? 0 : 10,
                            logging: configService.get<any>('DATABASE_LOG') === 'true' ? true : false,
                            ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
                        }
                    },
                    inject: [ConfigService]

                }),
            ]
        }
    }
}