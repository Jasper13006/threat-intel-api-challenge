import { z } from 'zod';

export const DashboardQuerySchema = z.object({
    time_range: z.enum(['24h', '7d', '30d']).default('7d'),
});

export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;