import { getDb } from '../../db/client';
import { IndicatorRow } from '../../types/database';
import {
    ThreatActorAssociation,
    CampaignAssociation,
    RelatedIndicator,
    SearchFilters,
} from './indicator.types';

export function getIndicator(id: string): IndicatorRow | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM indicators WHERE id = ?');
    return stmt.get(id) as IndicatorRow | undefined;
}

export function getThreatActors(indicatorId: string): ThreatActorAssociation[] {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT DISTINCT ta.id, ta.name, ac.confidence
    FROM threat_actors ta
    JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
    JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
    WHERE ci.indicator_id = ?
  `);
    return stmt.all(indicatorId) as ThreatActorAssociation[];
}

export function getCampaigns(indicatorId: string): CampaignAssociation[] {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT c.id, c.name, c.status, ci.observed_at
    FROM campaigns c
    JOIN campaign_indicators ci ON c.id = ci.campaign_id
    WHERE ci.indicator_id = ?
  `);
    return stmt.all(indicatorId) as CampaignAssociation[];
}

export function getRelatedIndicators(indicatorId: string): RelatedIndicator[] {
    const db = getDb();
    const stmt = db.prepare(`
    SELECT i.id, i.type, i.value, ir.relationship_type
    FROM indicators i
    JOIN indicator_relationships ir ON i.id = ir.target_indicator_id
    WHERE ir.source_indicator_id = ?
    LIMIT 5
  `);
    return stmt.all(indicatorId) as RelatedIndicator[];
}

interface WhereClauseResult {
    sql: string;
    params: unknown[];
}

function buildWhereClause(filters: SearchFilters): WhereClauseResult {
    let sql = '';
    const params: unknown[] = [];

    if (filters.type) {
        sql += ' AND i.type = ?';
        params.push(filters.type);
    }

    if (filters.value) {
        sql += ' AND i.value LIKE ?';
        params.push(`%${filters.value}%`);
    }

    if (filters.threat_actor) {
        sql += ' AND ac.threat_actor_id = ?';
        params.push(filters.threat_actor);
    }

    if (filters.campaign) {
        sql += ' AND ci.campaign_id = ?';
        params.push(filters.campaign);
    }

    if (filters.first_seen_after) {
        sql += ' AND i.first_seen >= ?';
        params.push(filters.first_seen_after);
    }

    if (filters.last_seen_before) {
        sql += ' AND i.last_seen <= ?';
        params.push(filters.last_seen_before);
    }

    return { sql, params };
}

export function searchIndicators(
    filters: SearchFilters,
    limit: number,
    offset: number
): IndicatorRow[] {
    const db = getDb();

    let sql = `
    SELECT DISTINCT i.*
    FROM indicators i
    LEFT JOIN campaign_indicators ci ON i.id = ci.indicator_id
    LEFT JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id
    WHERE 1=1
  `;

    const whereClause = buildWhereClause(filters);
    sql += whereClause.sql;
    sql += ' ORDER BY i.first_seen DESC LIMIT ? OFFSET ?';

    const params = [...whereClause.params, limit, offset];

    const stmt = db.prepare(sql);
    return stmt.all(...params) as IndicatorRow[];
}

export function countIndicators(filters: SearchFilters): number {
    const db = getDb();

    let sql = `
    SELECT COUNT(DISTINCT i.id) as count
    FROM indicators i
    LEFT JOIN campaign_indicators ci ON i.id = ci.indicator_id
    LEFT JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id
    WHERE 1=1
  `;

    const whereClause = buildWhereClause(filters);
    sql += whereClause.sql;

    const stmt = db.prepare(sql);
    const result = stmt.get(...whereClause.params) as { count: number };
    return result.count;
}