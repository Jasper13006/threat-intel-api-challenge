import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';

describe('Campaigns API', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/campaigns/:id/indicators', () => {
        it('should return 404 for non-existent campaign', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/campaigns/00000000-0000-0000-0000-000000000000/indicators',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('NOT_FOUND');
        });

        it('should return 400 for invalid UUID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/campaigns/invalid-id/indicators',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return timeline with indicators grouped by day', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/campaigns/6d25532f-81ab-491d-89c4-436b53b57f9b/indicators?group_by=day',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('campaign_id');
            expect(body.data).toHaveProperty('groups');
            expect(Array.isArray(body.data.groups)).toBe(true);

            if (body.data.groups.length > 0) {
                const group = body.data.groups[0];
                expect(group).toHaveProperty('period');
                expect(group).toHaveProperty('indicators');
                expect(group).toHaveProperty('counts_by_type');
                expect(group).toHaveProperty('total');
            }
        });

        it('should return timeline grouped by week', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/campaigns/6d25532f-81ab-491d-89c4-436b53b57f9b/indicators?group_by=week',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('groups');
        });

        it('should return 400 for invalid group_by parameter', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/campaigns/6d25532f-81ab-491d-89c4-436b53b57f9b/indicators?group_by=month',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should filter by date range', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/campaigns/6d25532f-81ab-491d-89c4-436b53b57f9b/indicators?start_date=2024-01-01T00:00:00Z&end_date=2024-12-31T23:59:59Z',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
        });
    });
});
