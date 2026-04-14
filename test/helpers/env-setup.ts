import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env.test') });

process.env.NODE_ENV = 'test';
process.env.TYPEORM_ALLOW_SCHEMA_SYNC = 'true';
