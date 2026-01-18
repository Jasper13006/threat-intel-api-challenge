import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { dashboardService } from './dashboard.service';
import { DashboardQuerySchema, DashboardQuery } from './dashboard.schema';
import { createSuccessResponse } from '../../shared/response';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().get(
        '/summary',
        {
            schema: {
                description: 'Get dashboard summary statistics',
                tags: ['dashboard'],
                querystring: DashboardQuerySchema,
            },
        },
        async (
            request: FastifyRequest<{ Querystring: DashboardQuery }>,
            reply: FastifyReply
        ) => {
            const { time_range } = request.query;

            const stats = await dashboardService.getDashboardStats(time_range);

            return reply.send(createSuccessResponse(stats));
        }
    );
}
