import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/app-factory';
import { seedBase, seedRegularUser, TEST_USER_PASSWORD } from './helpers/seed';
import { AuditLogEntity } from '../src/database/postgres/entities/audit-log.entity';

describe('Audit log (e2e)', () => {
    let app!: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;
    let regularToken: string;
    let adminId: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;

        const seed = await seedBase(dataSource, 'audit-test');
        adminId = seed.user.id;
        const regular = await seedRegularUser(dataSource, 'audit-test');

        const adminLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: seed.user.email, password: TEST_USER_PASSWORD });
        adminToken = adminLogin.body.data.accessToken;

        const regularLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: regular.email, password: TEST_USER_PASSWORD });
        regularToken = regularLogin.body.data.accessToken;

        const repo = dataSource.getRepository(AuditLogEntity);
        await repo.save([
            repo.create({
                actorId: adminId,
                action: 'timesheet.status.change',
                entityType: 'Timesheet',
                entityId: '11111111-1111-1111-1111-111111111111',
                before: { status: 'SUBMITTED' },
                after: { status: 'APPROVED' },
            }),
            repo.create({
                actorId: adminId,
                action: 'user.role.change',
                entityType: 'User',
                entityId: '22222222-2222-2222-2222-222222222222',
                before: { role: 'USER' },
                after: { role: 'MANAGER' },
            }),
            repo.create({
                actorId: adminId,
                action: 'payroll.period.lock',
                entityType: 'PayrollPeriod',
                entityId: '33333333-3333-3333-3333-333333333333',
                before: { lockedAt: null },
                after: { lockedAt: new Date().toISOString() },
            }),
        ]);
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('GET /api/audit-logs as ADMIN returns entries with total', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/audit-logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.total).toBeGreaterThanOrEqual(3);
        expect(res.body.data.items.length).toBeGreaterThanOrEqual(3);
        expect(res.body.data.items[0].actor).toBeDefined();
    });

    it('GET /api/audit-logs as USER returns 403', async () => {
        await request(app.getHttpServer())
            .get('/api/audit-logs')
            .set('Authorization', `Bearer ${regularToken}`)
            .expect(403);
    });

    it('GET /api/audit-logs?entityType=User filters correctly', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/audit-logs?entityType=User')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.items.every((i: any) => i.entityType === 'User')).toBe(true);
        expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/audit-logs?action=payroll.period.lock filters by action', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/audit-logs?action=payroll.period.lock')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.items.every((i: any) => i.action === 'payroll.period.lock')).toBe(true);
    });

    it('GET /api/audit-logs without bearer token returns 401', async () => {
        await request(app.getHttpServer())
            .get('/api/audit-logs')
            .expect(401);
    });
});
