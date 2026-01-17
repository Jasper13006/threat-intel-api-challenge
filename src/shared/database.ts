export interface IndicatorRow {
    id: string;
    type: string;
    value: string;
    confidence: number;
    first_seen: string;
    last_seen: string;
    created_at: string;
    updated_at: string;
}

export interface ThreatActorRow {
    id: string;
    name: string;
    description: string | null;
    origin: string | null;
    first_seen: string;
    last_seen: string;
    created_at: string;
    updated_at: string;
}

export interface CampaignRow {
    id: string;
    name: string;
    description: string | null;
    status: string;
    start_date: string;
    end_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface CampaignIndicatorRow {
    campaign_id: string;
    indicator_id: string;
    observed_at: string;
}

export interface ActorCampaignRow {
    threat_actor_id: string;
    campaign_id: string;
    confidence: number;
}

export interface IndicatorRelationshipRow {
    source_indicator_id: string;
    target_indicator_id: string;
    relationship_type: string;
}

export interface ObservationRow {
    id: string;
    indicator_id: string;
    observed_at: string;
    source: string;
    context: string | null;
    created_at: string;
}