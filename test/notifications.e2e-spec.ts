import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/app-factory';
import { seedBase, seedRegularUser, TEST_USER_PASSWORD } from './helpers/seed';
import { NotificationEntity } from '../src/database/postgres/entities/notification.entity';

describe('Notifications (e2e)', () => {
    let app!: INestApplication;
    let dataSource: DataSource;
    let adminEmail: string;
    let adminId: string;
    let adminToken: string;
    let regularToken: string;
    let seededIds: string[];

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;
        const seed = await seedBase(dataSource, 'notifications-test');
        adminEmail = seed.user.email!;
        adminId = seed.user.id;
        const regular = await seedRegularUser(dataSource, 'notifications-test');

        const adminLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: adminEmail, password: TEST_USER_PASSWORD });
        adminToken = adminLogin.body.data.accessToken;

        const regularLogin = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: regular.email, password: TEST_USER_PASSWORD });
        regularToken = regularLogin.body.data.accessToken;

        const repo = dataSource.getRepository(NotificationEntity);
        const rows = await repo.save([
            repo.create({
                userId: adminId,
                type: 'test.one',
                title: 'First',
                body: 'Body one',
                metadata: { link: '/hours' },
            }),
            repo.create({
                userId: adminId,
                type: 'test.two',
                title: 'Second',
                body: 'Body two',
                metadata: null,
            }),
            repo.create({
                userId: adminId,
                type: 'test.three',
                title: 'Third',
                body: 'Body three',
                metadata: null,
            }),
        ]);
        seededIds = rows.map((r) => r.id);
    });

    afterAll(async () => {
        try { await app?.close(); } catch { /* ignore */ }
    });

    it('GET /api/notifications returns the current user rows with unreadCount', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/notifications')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.total).toBe(3);
        expect(res.body.data.unreadCount).toBe(3);
        expect(res.body.data.items).toHaveLength(3);
    });

    it('other users only see their own notifications', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/notifications')
            .set('Authorization', `Bearer ${regularToken}`)
            .expect(200);
        expect(res.body.data.total).toBe(0);
        expect(res.body.data.items).toEqual([]);
    });

    it('PUT /api/notifications/:id/read marks a single row as read', async () => {
        const target = seededIds[0];
        const res = await request(app.getHttpServer())
            .put(`/api/notifications/${target}/read`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.readAt).toBeTruthy();

        const list = await request(app.getHttpServer())
            .get('/api/notifications')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(list.body.data.unreadCount).toBe(2);
    });

    it('GET /api/notifications?unread=true filters out read rows', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/notifications?unread=true')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.items.every((n: any) => !n.readAt)).toBe(true);
    });

    it('PUT /api/notifications/read-all clears unread count', async () => {
        await request(app.getHttpServer())
            .put('/api/notifications/read-all')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        const res = await request(app.getHttpServer())
            .get('/api/notifications')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.unreadCount).toBe(0);
    });

    it('DELETE /api/notifications/:id removes a single row', async () => {
        const target = seededIds[2];
        await request(app.getHttpServer())
            .delete(`/api/notifications/${target}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        const res = await request(app.getHttpServer())
            .get('/api/notifications')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.data.total).toBe(2);
    });

    it('GET /api/notifications without bearer token returns 401', async () => {
        await request(app.getHttpServer())
            .get('/api/notifications')
            .expect(401);
    });
});
