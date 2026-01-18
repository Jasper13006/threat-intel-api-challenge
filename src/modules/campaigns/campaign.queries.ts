import { getDb } from '../../db/client';
import { CampaignRow } from '../../types/database';
import { IndicatorTimeline } from './campaign.types';

export function getCampaign(id: string): CampaignRow | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM campaigns WHERE id = ?');
    return stmt.get(id) as CampaignRow | undefined;
}

export function getCampaignIndicators(
    campaignId: string,
    startDate?: string,
    endDate?: string
): IndicatorTimeline[] {
    const db = getDb();

    let sql = `
    SELECT
      i.id, i.type, i.value, i.confidence,
      ci.observed_at,
      strftime('%Y-%m-%d', ci.observed_at) as day_key,
      strftime('%Y-W%W', ci.observed_at) as week_key
    FROM campaign_indicators ci
    JOIN indicators i ON ci.indicator_id = i.id
    WHERE ci.campaign_id = ?
  `;

    const params: unknown[] = [campaignId];

    if (startDate) {
        sql += ' AND ci.observed_at >= ?';
        params.push(startDate);
    }

    if (endDate) {
        sql += ' AND ci.observed_at <= ?';
        params.push(endDate);
    }

    sql += ' ORDER BY ci.observed_at DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as IndicatorTimeline[];
}