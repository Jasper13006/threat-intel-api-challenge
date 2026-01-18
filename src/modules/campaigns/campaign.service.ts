import { NotFoundError } from '../../shared/errors';
import * as queries from './campaign.queries';
import {
    CampaignTimeline,
    IndicatorTimeline,
    TimelineGroup,
} from './campaign.types';

export class CampaignService {
    async getCampaignTimeline(
        campaignId: string,
        groupBy: 'day' | 'week',
        startDate?: string,
        endDate?: string
    ): Promise<CampaignTimeline> {
        const campaign = await Promise.resolve(queries.getCampaign(campaignId));

        if (!campaign) {
            throw new NotFoundError('Campaign', campaignId);
        }

        const indicators = await Promise.resolve(
            queries.getCampaignIndicators(campaignId, startDate, endDate)
        );

        const groups = this.groupIndicators(indicators, groupBy);

        return {
            campaign_id: campaignId,
            groups,
        };
    }

    private groupIndicators(
        indicators: IndicatorTimeline[],
        groupBy: 'day' | 'week'
    ): TimelineGroup[] {
        const keyField = groupBy === 'day' ? 'day_key' : 'week_key';
        const grouped = new Map<string, IndicatorTimeline[]>();

        for (const indicator of indicators) {
            const key = indicator[keyField] || 'unknown';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(indicator);
        }

        const groups: TimelineGroup[] = [];
        for (const [period, periodIndicators] of grouped.entries()) {
            const countsByType: Record<string, number> = {};

            for (const indicator of periodIndicators) {
                countsByType[indicator.type] = (countsByType[indicator.type] || 0) + 1;
            }

            groups.push({
                period,
                indicators: periodIndicators,
                counts_by_type: countsByType,
                total: periodIndicators.length,
            });
        }

        return groups.sort((a, b) => b.period.localeCompare(a.period));
    }
}

export const campaignService = new CampaignService();