import { getDb } from '../../db/client';
import { IndicatorDistribution, TopEntity } from './dashboard.types';

function getTimeRangeModifier(timeRange: string): string {
    switch (timeRange) {
        case '24h':
            return '-1 days';
        case '7d':
            return '-7 days';
        case '30d':
            return '-30 days';
        default:
            return '-7 days';
    }
}

export function getIndicatorDistribution(): IndicatorDistribution[] {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM indicators
    GROUP BY type
  `);
    return stmt.all() as IndicatorDistribution[];
}

export function getNewIndicatorsCount(timeRange: string): number {
    const db = getDb();
    const modifier = getTimeRangeModifier(timeRange);
    const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM indicators
    WHERE created_at >= datetime('now', ?)
  `);
    const result = stmt.get(modifier) as { count: number };
    return result.count;
}

export function getActiveCampaignsCount(): number {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM campaigns
    WHERE status = 'active'
  `);
    const result = stmt.get() as { count: number };
    return result.count;
}

export function getTopThreatActors(): TopEntity[] {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT ta.id, ta.name, COUNT(DISTINCT ci.indicator_id) as count
    FROM threat_actors ta
    JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
    JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
    GROUP BY ta.id
    ORDER BY count DESC
    LIMIT 5
  `);
    return stmt.all() as TopEntity[];
}

export function getRecentObservationsCount(timeRange: string): number {
    const db = getDb();
    const modifier = getTimeRangeModifier(timeRange);
    const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM observations
    WHERE observed_at >= datetime('now', ?)
  `);
    const result = stmt.get(modifier) as { count: number };
    return result.count;
}

export function getTopCampaigns(): TopEntity[] {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT c.id, c.name, COUNT(ci.indicator_id) as count
    FROM campaigns c
    JOIN campaign_indicators ci ON c.id = ci.campaign_id
    GROUP BY c.id
    ORDER BY count DESC
    LIMIT 5
  `);
    return stmt.all() as TopEntity[];
}