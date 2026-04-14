import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/app-factory';
import { seedBase, seedProject, TEST_USER_PASSWORD } from './helpers/seed';

describe('Timesheets (e2e)', () => {
    let app!: INestApplication;
    let dataSource: DataSource;
    let token: string;
    let userId: string;
    let projectId: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;

        const seed = await seedBase(dataSource, 'timesheets-test');
        userId = seed.user.id;
        const project = await seedProject(dataSource, seed.user);
        projectId = project.id;

        const login = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: seed.user.email, password: TEST_USER_PASSWORD });
        token = login.body?.data?.accessToken;
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('POST /api/timesheets creates a timesheet entry', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/timesheets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                projectId,
                userId,
                weekNumber: 42,
                year: 2026,
                hours: 8,
                date: new Date('2026-10-12').toISOString(),
            })
            .expect(201);
        expect(res.body?.data?.id).toBeDefined();
    });
});
