import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { campaignService } from './campaign.service';
import {
    CampaignIdParamsSchema,
    TimelineQuerySchema,
    CampaignIdParams,
    TimelineQuery,
} from './campaign.schema';
import { createSuccessResponse } from '../../shared/response';

export async function campaignRoutes(fastify: FastifyInstance) {
    fastify.get<{ Params: CampaignIdParams; Querystring: TimelineQuery }>(
        '/:id/indicators',
        {
            schema: {
                description: 'Get campaign indicators grouped by timeline',
                tags: ['campaigns'],
            },
        },
        async (
            request: FastifyRequest<{ Params: CampaignIdParams; Querystring: TimelineQuery }>,
            reply: FastifyReply
        ) => {
            const validatedParams = CampaignIdParamsSchema.parse(request.params);
            const validatedQuery = TimelineQuerySchema.parse(request.query);
            const { group_by, start_date, end_date } = validatedQuery;

            const timeline = await campaignService.getCampaignTimeline(
                validatedParams.id,
                group_by,
                start_date,
                end_date
            );

            return reply.send(createSuccessResponse(timeline));
        }
    );
}