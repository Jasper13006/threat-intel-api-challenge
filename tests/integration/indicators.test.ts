import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';

describe('Indicators API', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/indicators/:id', () => {
        it('should return 404 for non-existent indicator', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/indicators/00000000-0000-0000-0000-000000000000',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('NOT_FOUND');
        });

        it('should return 400 for invalid UUID', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/indicators/invalid-id',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return indicator details with relationships', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/indicators/56bb178b-52bd-4d30-8bc1-790b79c16499',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data).toHaveProperty('id');
            expect(body.data).toHaveProperty('type');
            expect(body.data).toHaveProperty('value');
            expect(body.data).toHaveProperty('threat_actors');
            expect(body.data).toHaveProperty('campaigns');
            expect(body.data).toHaveProperty('related_indicators');
        });
    });

    describe('GET /api/indicators/search', () => {
        it('should return paginated results', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/indicators/search?page=1&limit=10',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.meta).toHaveProperty('pagination');
            expect(body.meta.pagination).toHaveProperty('page');
            expect(body.meta.pagination).toHaveProperty('limit');
            expect(body.meta.pagination).toHaveProperty('total');
            expect(body.meta.pagination).toHaveProperty('totalPages');
        });

        it('should filter by type', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/indicators/search?type=ip',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(true);
            body.data.forEach((indicator: { type: string }) => {
                expect(indicator.type).toBe('ip');
            });
        });

        it('should return 400 for invalid type', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/indicators/search?type=invalid',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe('VALIDATION_ERROR');
        });
    });
});