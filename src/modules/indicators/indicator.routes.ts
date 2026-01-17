import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { indicatorService } from './indicator.service';
import { IdParamsSchema, SearchQuerySchema, IdParams, SearchQuery } from './indicator.schema';
import { createSuccessResponse } from '../../shared/response';
import { createPaginationMeta } from '../../shared/pagination';

export async function indicatorRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        description: 'Get detailed information about a specific indicator',
        tags: ['indicators'],
      },
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const validated = IdParamsSchema.parse(request.params);
      const indicator = await indicatorService.getIndicatorById(validated.id);
      return reply.send(createSuccessResponse(indicator));
    }
  );

  fastify.get<{ Querystring: SearchQuery }>(
    '/search',
    {
      schema: {
        description: 'Search indicators with various filters',
        tags: ['indicators'],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: SearchQuery }>,
      reply: FastifyReply
    ) => {
      const validated = SearchQuerySchema.parse(request.query);
      const { page, limit, ...filters } = validated;

      const result = await indicatorService.searchIndicators(filters, page, limit);

      return reply.send(
        createSuccessResponse(result.indicators, {
          pagination: createPaginationMeta(page, limit, result.total),
        })
      );
    }
  );
}