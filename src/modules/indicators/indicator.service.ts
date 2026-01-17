import { NotFoundError } from '../../shared/errors';
import { calculatePagination } from '../../shared/pagination';
import * as queries from './indicator.queries';
import { IndicatorDetails, SearchFilters, SearchResult } from './indicator.types';

export class IndicatorService {
    async getIndicatorById(id: string): Promise<IndicatorDetails> {
        const [indicator, threatActors, campaigns, relatedIndicators] = await Promise.all([
            Promise.resolve(queries.getIndicator(id)),
            Promise.resolve(queries.getThreatActors(id)),
            Promise.resolve(queries.getCampaigns(id)),
            Promise.resolve(queries.getRelatedIndicators(id)),
        ]);

        if (!indicator) {
            throw new NotFoundError('Indicator', id);
        }

        return {
            ...indicator,
            threat_actors: threatActors,
            campaigns: campaigns,
            related_indicators: relatedIndicators,
        };
    }

    async searchIndicators(
        filters: SearchFilters,
        page: number,
        limit: number
    ): Promise<SearchResult> {
        const { limit: limitValue, offset } = calculatePagination(page, limit);

        const [indicators, total] = await Promise.all([
            Promise.resolve(queries.searchIndicators(filters, limitValue, offset)),
            Promise.resolve(queries.countIndicators(filters)),
        ]);

        return {
            indicators,
            total,
        };
    }
}

export const indicatorService = new IndicatorService();