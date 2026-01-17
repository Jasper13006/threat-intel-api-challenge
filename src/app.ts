import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { ZodError } from 'zod';
import { AppError } from './shared/errors';
import { createErrorResponse } from './shared/response';

export async function buildApp() {
    const app = Fastify({
        logger: true,
    });

    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Threat Intelligence API',
                description: 'Production-quality REST API for threat intelligence dashboard',
                version: '1.0.0',
            },
            tags: [
                { name: 'indicators', description: 'Indicator endpoints' },
                { name: 'campaigns', description: 'Campaign endpoints' },
                { name: 'dashboard', description: 'Dashboard endpoints' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });

    app.setErrorHandler(
        (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
            if (error instanceof AppError) {
                return reply.status(error.statusCode).send(
                    createErrorResponse(error.code, error.message, error.details)
                );
            }

            if (error instanceof ZodError) {
                return reply.status(400).send(
                    createErrorResponse(
                        'VALIDATION_ERROR',
                        'Invalid request parameters',
                        error.issues
                    )
                );
            }

            app.log.error(error);
            return reply.status(500).send(
                createErrorResponse(
                    'INTERNAL_ERROR',
                    'An unexpected error occurred'
                )
            );
        }
    );

    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    return app;
}