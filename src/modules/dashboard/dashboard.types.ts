export interface IndicatorDistribution {
    type: string;
    count: number;
}

export interface TopEntity {
    id: string;
    name: string;
    count: number;
}

export interface DashboardStats {
    indicator_distribution: IndicatorDistribution[];
    new_indicators_count: number;
    active_campaigns_count: number;
    top_threat_actors: TopEntity[];
    recent_observations_count: number;
    top_campaigns: TopEntity[];
    time_range: string;
    generated_at: string;
}

export interface CachedDashboard {
    data: DashboardStats;
    timestamp: number;
    timeRange: string;
}