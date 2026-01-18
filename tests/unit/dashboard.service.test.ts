import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from '../../src/modules/dashboard/dashboard.service';
import * as queries from '../../src/modules/dashboard/dashboard.queries';

// Mock the queries module
vi.mock('../../src/modules/dashboard/dashboard.queries', () => ({
    getIndicatorDistribution: vi.fn(),
    getNewIndicatorsCount: vi.fn(),
    getActiveCampaignsCount: vi.fn(),
    getTopThreatActors: vi.fn(),
    getRecentObservationsCount: vi.fn(),
    getTopCampaigns: vi.fn(),
}));

describe('DashboardService', () => {
    beforeEach(() => {
        // Clear cache before each test
        dashboardService.clearCache();

        // Reset all mocks
        vi.clearAllMocks();

        // Setup default mock implementations
        vi.mocked(queries.getIndicatorDistribution).mockReturnValue([
            { type: 'ip', count: 3000 },
            { type: 'domain', count: 3000 },
            { type: 'url', count: 2500 },
            { type: 'hash', count: 1500 },
        ]);
        vi.mocked(queries.getNewIndicatorsCount).mockReturnValue(150);
        vi.mocked(queries.getActiveCampaignsCount).mockReturnValue(12);
        vi.mocked(queries.getTopThreatActors).mockReturnValue([
            { id: 'ta-1', name: 'APT28', count: 456 },
            { id: 'ta-2', name: 'Lazarus', count: 234 },
        ]);
        vi.mocked(queries.getRecentObservationsCount).mockReturnValue(890);
        vi.mocked(queries.getTopCampaigns).mockReturnValue([
            { id: 'c-1', name: 'Operation A', count: 123 },
            { id: 'c-2', name: 'Operation B', count: 89 },
        ]);
    });

    describe('getDashboardStats', () => {
        it('should fetch dashboard stats from queries', async () => {
            const stats = await dashboardService.getDashboardStats('7d');

            expect(stats).toHaveProperty('indicator_distribution');
            expect(stats).toHaveProperty('new_indicators_count');
            expect(stats).toHaveProperty('active_campaigns_count');
            expect(stats).toHaveProperty('top_threat_actors');
            expect(stats).toHaveProperty('recent_observations_count');
            expect(stats).toHaveProperty('top_campaigns');
            expect(stats).toHaveProperty('time_range');
            expect(stats).toHaveProperty('generated_at');
        });

        it('should include correct time_range in response', async () => {
            const stats = await dashboardService.getDashboardStats('24h');
            expect(stats.time_range).toBe('24h');

            dashboardService.clearCache();

            const stats2 = await dashboardService.getDashboardStats('30d');
            expect(stats2.time_range).toBe('30d');
        });

        it('should call all query functions', async () => {
            await dashboardService.getDashboardStats('7d');

            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1);
            expect(queries.getNewIndicatorsCount).toHaveBeenCalledWith('7d');
            expect(queries.getActiveCampaignsCount).toHaveBeenCalledTimes(1);
            expect(queries.getTopThreatActors).toHaveBeenCalledTimes(1);
            expect(queries.getRecentObservationsCount).toHaveBeenCalledWith('7d');
            expect(queries.getTopCampaigns).toHaveBeenCalledTimes(1);
        });

        it('should include generated_at timestamp', async () => {
            const before = new Date().toISOString();
            const stats = await dashboardService.getDashboardStats('7d');
            const after = new Date().toISOString();

            expect(stats.generated_at).toBeDefined();
            expect(stats.generated_at >= before).toBe(true);
            expect(stats.generated_at <= after).toBe(true);
        });
    });

    describe('Cache behavior', () => {
        it('should cache results for same time_range', async () => {
            // First call
            const stats1 = await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1);

            // Second call should use cache
            const stats2 = await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1); // Still 1, not 2

            // Results should be the same
            expect(stats1).toEqual(stats2);
        });

        it('should not use cache for different time_range', async () => {
            // First call with 7d
            await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1);

            // Second call with 24h should not use cache
            await dashboardService.getDashboardStats('24h');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(2);
        });

        it('should expire cache after TTL', async () => {
            // Mock Date.now to control time
            const originalNow = Date.now;
            let currentTime = 1000000;

            vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

            // First call
            await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1);

            // Advance time by 4 minutes (less than 5 min TTL)
            currentTime += 4 * 60 * 1000;
            await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1); // Still cached

            // Advance time by 2 more minutes (total 6 minutes, exceeds TTL)
            currentTime += 2 * 60 * 1000;
            await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(2); // Cache expired

            // Restore Date.now
            vi.spyOn(Date, 'now').mockRestore();
        });

        it('should refresh cache when clearCache is called', async () => {
            // First call
            await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(1);

            // Clear cache
            dashboardService.clearCache();

            // Second call should fetch fresh data
            await dashboardService.getDashboardStats('7d');
            expect(queries.getIndicatorDistribution).toHaveBeenCalledTimes(2);
        });
    });

    describe('Data aggregation', () => {
        it('should aggregate indicator distribution correctly', async () => {
            const stats = await dashboardService.getDashboardStats('7d');

            expect(Array.isArray(stats.indicator_distribution)).toBe(true);
            expect(stats.indicator_distribution).toEqual([
                { type: 'ip', count: 3000 },
                { type: 'domain', count: 3000 },
                { type: 'url', count: 2500 },
                { type: 'hash', count: 1500 },
            ]);
        });

        it('should return top threat actors as array', async () => {
            const stats = await dashboardService.getDashboardStats('7d');

            expect(Array.isArray(stats.top_threat_actors)).toBe(true);
            expect(stats.top_threat_actors).toHaveLength(2);
            expect(stats.top_threat_actors[0]).toEqual({
                id: 'ta-1',
                name: 'APT28',
                count: 456,
            });
        });

        it('should return top campaigns as array', async () => {
            const stats = await dashboardService.getDashboardStats('7d');

            expect(Array.isArray(stats.top_campaigns)).toBe(true);
            expect(stats.top_campaigns).toHaveLength(2);
            expect(stats.top_campaigns[0]).toEqual({
                id: 'c-1',
                name: 'Operation A',
                count: 123,
            });
        });
    });
});
