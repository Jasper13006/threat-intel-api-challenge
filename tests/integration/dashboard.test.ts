import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';

describe('Dashboard API', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/dashboard/summary', () => {
        it('should return dashboard stats with default time range', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('indicator_distribution');
            expect(body.data).toHaveProperty('new_indicators_count');
            expect(body.data).toHaveProperty('active_campaigns_count');
            expect(body.data).toHaveProperty('top_threat_actors');
            expect(body.data).toHaveProperty('recent_observations_count');
            expect(body.data).toHaveProperty('top_campaigns');
            expect(body.data).toHaveProperty('time_range');
            expect(body.data).toHaveProperty('generated_at');
        });

        it('should return stats for 24h time range', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary?time_range=24h',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data.time_range).toBe('24h');
        });

        it('should return stats for 7d time range', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary?time_range=7d',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data.time_range).toBe('7d');
        });

        it('should return stats for 30d time range', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary?time_range=30d',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data.time_range).toBe('30d');
        });

        it('should return 400 for invalid time_range', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary?time_range=invalid',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return indicator distribution by type', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body.data.indicator_distribution)).toBe(true);
            expect(body.data.indicator_distribution.length).toBeGreaterThan(0);

            const distribution = body.data.indicator_distribution[0];
            expect(distribution).toHaveProperty('type');
            expect(distribution).toHaveProperty('count');
            expect(typeof distribution.count).toBe('number');
        });

        it('should return top threat actors as array', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body.data.top_threat_actors)).toBe(true);
            expect(body.data.top_threat_actors.length).toBeLessThanOrEqual(5);

            if (body.data.top_threat_actors.length > 0) {
                const actor = body.data.top_threat_actors[0];
                expect(actor).toHaveProperty('id');
                expect(actor).toHaveProperty('name');
                expect(actor).toHaveProperty('count');
                expect(typeof actor.count).toBe('number');
            }
        });

        it('should return top campaigns as array', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/dashboard/summary',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body.data.top_campaigns)).toBe(true);
            expect(body.data.top_campaigns.length).toBeLessThanOrEqual(5);

            if (body.data.top_campaigns.length > 0) {
                const campaign = body.data.top_campaigns[0];
                expect(campaign).toHaveProperty('id');
                expect(campaign).toHaveProperty('name');
                expect(campaign).toHaveProperty('count');
                expect(typeof campaign.count).toBe('number');
            }
        });
    });
});
