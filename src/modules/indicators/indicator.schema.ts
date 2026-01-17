import { z } from 'zod';

export const IdParamsSchema = z.object({
    id: z.string().uuid('Invalid indicator ID format'),
});

export const SearchQuerySchema = z.object({
    type: z.enum(['ip', 'domain', 'url', 'hash']).optional(),
    value: z.string().optional(),
    threat_actor: z.string().uuid('Invalid threat actor ID format').optional(),
    campaign: z.string().uuid('Invalid campaign ID format').optional(),
    first_seen_after: z.string().datetime('Invalid datetime format').optional(),
    last_seen_before: z.string().datetime('Invalid datetime format').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type IdParams = z.infer<typeof IdParamsSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;