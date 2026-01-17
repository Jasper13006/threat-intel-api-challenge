import { IndicatorRow } from '../../types/database';

export interface ThreatActorAssociation {
    id: string;
    name: string;
    confidence: number;
}

export interface CampaignAssociation {
    id: string;
    name: string;
    status: string;
    observed_at: string;
}

export interface RelatedIndicator {
    id: string;
    type: string;
    value: string;
    relationship_type: string;
}

export interface IndicatorDetails extends IndicatorRow {
    threat_actors: ThreatActorAssociation[];
    campaigns: CampaignAssociation[];
    related_indicators: RelatedIndicator[];
}

export interface SearchFilters {
    type?: string;
    value?: string;
    threat_actor?: string;
    campaign?: string;
    first_seen_after?: string;
    last_seen_before?: string;
}

export interface SearchResult {
    indicators: IndicatorRow[];
    total: number;
}
