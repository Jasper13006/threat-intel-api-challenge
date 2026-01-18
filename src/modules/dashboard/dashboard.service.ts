import * as queries from './dashboard.queries';
import { DashboardStats, CachedDashboard } from './dashboard.types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: CachedDashboard | null = null;

export class DashboardService {
    async getDashboardStats(timeRange: string): Promise<DashboardStats> {
        if (cache && cache.timeRange === timeRange && Date.now() - cache.timestamp < CACHE_TTL) {
            return cache.data;
        }

        const [
            indicatorDistribution,
            newIndicatorsCount,
            activeCampaignsCount,
            topThreatActors,
            recentObservationsCount,
            topCampaigns,
        ] = await Promise.all([
            Promise.resolve(queries.getIndicatorDistribution()),
            Promise.resolve(queries.getNewIndicatorsCount(timeRange)),
            Promise.resolve(queries.getActiveCampaignsCount()),
            Promise.resolve(queries.getTopThreatActors()),
            Promise.resolve(queries.getRecentObservationsCount(timeRange)),
            Promise.resolve(queries.getTopCampaigns()),
        ]);

        const stats: DashboardStats = {
            indicator_distribution: indicatorDistribution,
            new_indicators_count: newIndicatorsCount,
            active_campaigns_count: activeCampaignsCount,
            top_threat_actors: topThreatActors,
            recent_observations_count: recentObservationsCount,
            top_campaigns: topCampaigns,
            time_range: timeRange,
            generated_at: new Date().toISOString(),
        };

        cache = {
            data: stats,
            timestamp: Date.now(),
            timeRange,
        };

        return stats;
    }

    clearCache(): void {
        cache = null;
    }
}

export const dashboardService = new DashboardService();