import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/app-factory';
import { seedBase, TEST_USER_PASSWORD } from './helpers/seed';

describe('Auth (e2e)', () => {
    let app!: INestApplication;
    let dataSource: DataSource;
    let email: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;
        const seed = await seedBase(dataSource, 'auth-test');
        email = seed.user.email!;
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('POST /api/auth/login with valid credentials returns tokens', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password: TEST_USER_PASSWORD })
            .expect(201);
        expect(res.body?.data?.accessToken).toBeDefined();
        expect(res.body?.data?.refreshToken).toBeDefined();
    });

    it('POST /api/auth/login with wrong password returns 401', async () => {
        await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password: 'WrongPassword1!' })
            .expect(401);
    });

    it('POST /api/auth/logout clears the refresh token hash', async () => {
        const login = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password: TEST_USER_PASSWORD })
            .expect(201);
        const { accessToken, refreshToken } = login.body.data;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();

        await request(app.getHttpServer())
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(201);

        await request(app.getHttpServer())
            .get('/api/auth/refresh')
            .set('Authorization', `Bearer ${refreshToken}`)
            .expect(403);
    });
});
