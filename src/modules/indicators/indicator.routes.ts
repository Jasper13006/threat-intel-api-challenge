import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { indicatorService } from './indicator.service';
import { IdParamsSchema, SearchQuerySchema, IdParams, SearchQuery } from './indicator.schema';
import { createSuccessResponse } from '../../shared/response';
import { createPaginationMeta } from '../../shared/pagination';

export async function indicatorRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/:id',
    {
      schema: {
        description: 'Get detailed information about a specific indicator',
        tags: ['indicators'],
        params: IdParamsSchema,
      },
    },
    async (request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) => {
      const indicator = await indicatorService.getIndicatorById(request.params.id);
      return reply.send(createSuccessResponse(indicator));
    }
  );

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/search',
    {
      schema: {
        description: 'Search indicators with various filters',
        tags: ['indicators'],
        querystring: SearchQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{ Querystring: SearchQuery }>,
      reply: FastifyReply
    ) => {
      const { page, limit, ...filters } = request.query;

      const result = await indicatorService.searchIndicators(filters, page, limit);

      return reply.send(
        createSuccessResponse(result.indicators, {
          pagination: createPaginationMeta(page, limit, result.total),
        })
      );
    }
  );
}
