import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/app-factory';
import { seedBase, TEST_USER_PASSWORD } from './helpers/seed';

describe('Users (e2e)', () => {
    let app!: INestApplication;
    let dataSource: DataSource;
    let email: string;
    let token: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;
        const seed = await seedBase(dataSource, 'users-test');
        email = seed.user.email!;

        const login = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password: TEST_USER_PASSWORD });
        token = login.body?.data?.accessToken;
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('GET /api/users with bearer token returns a list', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(Array.isArray(res.body?.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/users without bearer token returns 401', async () => {
        await request(app.getHttpServer())
            .get('/api/users')
            .expect(401);
    });
});
