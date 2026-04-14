import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/app-factory';

describe('Health (e2e)', () => {
    let app!: INestApplication;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('GET /api/health returns 200 with status ok', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/health')
            .expect(200);
        expect(res.body?.data?.status).toBe('ok');
    });

    it('GET /api/ready returns 200 when DB + SMTP are up', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/ready')
            .expect(200);
        expect(res.body?.data?.status).toBe('ok');
        expect(res.body?.data?.checks?.database?.status).toBe('up');
        expect(res.body?.data?.checks?.smtp?.status).toBe('up');
    });
});
