export interface IndicatorTimeline {
    id: string;
    type: string;
    value: string;
    confidence: number;
    observed_at: string;
    day_key?: string;
    week_key?: string;
}

export interface TimelineGroup {
    period: string;
    indicators: IndicatorTimeline[];
    counts_by_type: Record<string, number>;
    total: number;
}

export interface CampaignTimeline {
    campaign_id: string;
    groups: TimelineGroup[];
}