import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service';
import { DashboardQuerySchema, DashboardQuery } from './dashboard.schema';
import { createSuccessResponse } from '../../shared/response';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: DashboardQuery }>(
        '/summary',
        {
            schema: {
                description: 'Get dashboard summary statistics',
                tags: ['dashboard'],
            },
        },
        async (
            request: FastifyRequest<{ Querystring: DashboardQuery }>,
            reply: FastifyReply
        ) => {
            const validated = DashboardQuerySchema.parse(request.query);
            const { time_range } = validated;

            const stats = await dashboardService.getDashboardStats(time_range);

            return reply.send(createSuccessResponse(stats));
        }
    );
}