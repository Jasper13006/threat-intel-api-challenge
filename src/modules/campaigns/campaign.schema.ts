import { z } from 'zod';

export const CampaignIdParamsSchema = z.object({
    id: z.string().uuid('Invalid campaign ID format'),
});

export const TimelineQuerySchema = z.object({
    group_by: z.enum(['day', 'week']).default('day'),
    start_date: z.string().datetime('Invalid datetime format').optional(),
    end_date: z.string().datetime('Invalid datetime format').optional(),
});

export type CampaignIdParams = z.infer<typeof CampaignIdParamsSchema>;
export type TimelineQuery = z.infer<typeof TimelineQuerySchema>;