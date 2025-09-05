import { registerAs } from "@nestjs/config";

export const DATABASE_CONFIG = registerAs('DATABASE', () => {
    return {
        HOST: process.env['DATABASE_HOST'],
        PORT: parseInt(process.env['DATABASE_PORT'] || '', 10) || 27017,
        USER: process.env['DATABASE_USER'],
        PASSWORD: process.env['DATABASE_PASSWORD'],
        NAME: process.env['DATABASE_NAME'],
    };
})