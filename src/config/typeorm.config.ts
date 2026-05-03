import { registerAs } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Fail fast at boot if a required DB env var is missing. The previous
 * silent fallbacks (e.g. password="Roots123") meant a misconfigured
 * deploy would silently try to connect with the wrong creds; worse,
 * a real password ended up in source control.
 */
function required(key: string): string {
    const v = process.env[key];
    if (!v || !v.length) {
        throw new Error(`Missing required env var ${key}. Set it before starting the API.`);
    }
    return v;
}

const useSsl = process.env.DATABASE_SSL === 'true';
const config = {
    type: 'postgres',
    host: required('DATABASE_HOST'),
    port: Number(process.env.DATABASE_PORT || '5432'),
    username: required('DATABASE_USER'),
    password: required('DATABASE_PASSWORD'),
    database: required('DATABASE_NAME'),
    entities: ["src/**/*.entity{.ts,.js}"],
    migrations: ["src/database/postgres/migrations/*{.ts,.js}"],
    synchronize: false,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
