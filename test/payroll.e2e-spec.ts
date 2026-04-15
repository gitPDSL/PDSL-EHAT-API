import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/app-factory';
import { seedBase, seedProject, seedRegularUser, TEST_USER_PASSWORD } from './helpers/seed';

describe('Payroll (e2e)', () => {
    let app!: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;
    let regularToken: string;
    let regularUserId: string;
    let projectId: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;

        const seed = await seedBase(dataSource, 'payroll-test');
        const project = await seedProject(dataSource, seed.user);
        projectId = project.id;

        const regular = await seedRegularUser(dataSource, 'payroll-test');
        regularUserId = regular.id;

        const adminLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: seed.user.email, password: TEST_USER_PASSWORD });
        adminToken = adminLogin.body.data.accessToken;

        const regularLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: regular.email, password: TEST_USER_PASSWORD });
        regularToken = regularLogin.body.data.accessToken;
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('POST /api/payroll-periods as USER returns 403', async () => {
        await request(app.getHttpServer())
            .post('/api/payroll-periods')
            .set('Authorization', `Bearer ${regularToken}`)
            .send({ startDate: '2026-01-01', endDate: '2026-01-31' })
            .expect(403);
    });

    it('POST /api/payroll-periods as ADMIN creates an open period', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/payroll-periods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ startDate: '2026-01-01', endDate: '2026-01-31' })
            .expect(201);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.lockedAt).toBeNull();
    });

    it('locks a period, then blocks a non-admin timesheet in the range, then admins override', async () => {
        const created = await request(app.getHttpServer())
            .post('/api/payroll-periods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ startDate: '2026-03-01', endDate: '2026-03-31' })
            .expect(201);
        const periodId = created.body.data.id;

        await request(app.getHttpServer())
            .put(`/api/payroll-periods/${periodId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ lockedAt: new Date().toISOString() })
            .expect(200);

        const blocked = await request(app.getHttpServer())
            .post('/api/timesheets')
            .set('Authorization', `Bearer ${regularToken}`)
            .send({
                projectId,
                userId: regularUserId,
                weekNumber: 10,
                year: 2026,
                hours: 4,
                date: new Date('2026-03-10').toISOString(),
            })
            .expect(403);
        expect(blocked.body.meta?.message || blocked.body.message).toMatch(/locked/i);

        await request(app.getHttpServer())
            .post('/api/timesheets')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                projectId,
                userId: regularUserId,
                weekNumber: 10,
                year: 2026,
                hours: 4,
                date: new Date('2026-03-11').toISOString(),
            })
            .expect(201);
    });

    it('DELETE /api/payroll-periods/:id fails on a locked period, succeeds after unlock', async () => {
        const created = await request(app.getHttpServer())
            .post('/api/payroll-periods')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ startDate: '2026-06-01', endDate: '2026-06-30' })
            .expect(201);
        const periodId = created.body.data.id;

        await request(app.getHttpServer())
            .put(`/api/payroll-periods/${periodId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ lockedAt: new Date().toISOString() })
            .expect(200);

        await request(app.getHttpServer())
            .delete(`/api/payroll-periods/${periodId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(400);

        await request(app.getHttpServer())
            .put(`/api/payroll-periods/${periodId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ lockedAt: null })
            .expect(200);

        await request(app.getHttpServer())
            .delete(`/api/payroll-periods/${periodId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    });
});
