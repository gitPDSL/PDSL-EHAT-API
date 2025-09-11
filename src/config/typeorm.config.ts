import { registerAs } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();
const config = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'Roots123',
    database: process.env.DATABASE_NAME || 'ehat',
    entities: ["src/**/*.entity{.ts,.js}"],
    migrations: ["src/database/postgres/migrations/*{.ts,.js}"],
    synchronize: false,
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
