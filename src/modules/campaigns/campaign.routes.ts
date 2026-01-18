import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { campaignService } from './campaign.service';
import {
    CampaignIdParamsSchema,
    TimelineQuerySchema,
    CampaignIdParams,
    TimelineQuery,
} from './campaign.schema';
import { createSuccessResponse } from '../../shared/response';

export async function campaignRoutes(fastify: FastifyInstance) {
    fastify.withTypeProvider<ZodTypeProvider>().get(
        '/:id/indicators',
        {
            schema: {
                description: 'Get campaign indicators grouped by timeline',
                tags: ['campaigns'],
                params: CampaignIdParamsSchema,
                querystring: TimelineQuerySchema,
            },
        },
        async (
            request: FastifyRequest<{ Params: CampaignIdParams; Querystring: TimelineQuery }>,
            reply: FastifyReply
        ) => {

            const { group_by, start_date, end_date } = request.query;

            const timeline = await campaignService.getCampaignTimeline(
                request.params.id,
                group_by,
                start_date,
                end_date
            );

            return reply.send(createSuccessResponse(timeline));
        }
    );
}
