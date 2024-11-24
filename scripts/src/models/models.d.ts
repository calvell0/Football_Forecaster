export interface Team {
    id: number;
    uid: string;
    slug: string;
    abbreviation: string;
    display_name: string;
    short_display_name: string;
    color: string;
    alternate_color: string;
    is_active: boolean;
    is_all_star: boolean;
    logos: string[];
}

export interface TeamResponseObject {
    team: Team;
}

export interface NFLEventResponseObject {

}


export interface NFLEvent {
    id: number;
    uid: string;
    date: string;
    shortName: string;
    season: Season;
    week: number;
    status: "STATUS_SCHEDULED" | "STATUS_FINAL" | "STATUS_OTHER";
    competitions: Competition[];
}

export enum SeasonType {
    PRE_SEASON = 1,
    REGULAR_SEASON = 2,
    POST_SEASON = 3
}

export interface Season {
    year: number;
    type: SeasonType;
}

export interface Competition {
    id: number;
    uid: string;
    date: string;
    type: number;
    timeValid: boolean;
    neutralSite: boolean;
    conferenceCompetition: boolean;
    venue: Venue;
    competitors: [Competitor, Competitor];
}

export interface Venue {
    id: number;
}

export interface Competitor {
    teamId: number;
    homeAway: boolean;
    winner: boolean | null;
    score: number;
    records: [TeamRecord, TeamRecord, TeamRecord];
    event_id?: number;
}


export interface TeamRecord {
    type: RecordType;
    summary: string;
}

export enum RecordType {
    HOME = "home",
    AWAY = "away",
    TOTAL = "total"
}

export interface Boxscore {
    event_id: number;
    team_id: number;
    first_downs?: number;
    first_downs_passing?: number;
    first_downs_rushing?: number;
    first_downs_penalty?: number;
    third_down_conversions?: number;
    third_down_attempts?: number;
    fourth_down_conversions?: number;
    fourth_down_attempts?: number;
    total_offensive_plays?: number;
    total_offensive_yards?: number;
    total_drives?: number;
    net_passing_yards?: number;
    completions?: number;
    completion_attempts?: number;
    interceptions_thrown?: number;
    sacks_against?: number;
    yards_lost?: number;
    rushing_yards?: number;
    rushing_attempts?: number;
    red_zone_attempts?: number;
    red_zone_conversions?: number;
    penalties?: number;
    penalty_yards?: number;
    turnovers?: number;
    fumbles_lost?: number;
    passing_touchdowns?: number;
    rushing_touchdowns?: number;
    passer_rating?: number;
    tackles?: number;
    sacks?: number;
    tackles_for_loss?: number;
    passes_defended?: number;
    defensive_interceptions?: number;
    defensive_touchdowns?: number;
    kick_returns?: number;
    kick_return_yards?: number;
    punt_returns?: number;
    punt_return_yards?: number;
    field_goals_made?: number;
    field_goals_attempted?: number;
    punts?: number;
    punt_yards?: number;
}

export interface BoxscoreEventJoin extends Boxscore {
    date: string;
    season_year: number;
    week: number;
    game_num?: number;
}

export interface SeasonStats {
    event_id: number;
    team_id: number;
    avg_first_downs: number;
    avg_first_downs_passing: number;
    avg_first_downs_rushing: number;
    avg_first_downs_penalty: number;
    third_down_conversion_pct: number;
    fourth_down_conversion_pct: number;
    avg_offensive_plays: number;
    avg_offensive_yards: number;
    avg_drives: number;
    completion_pct: number;
    avg_interceptions: number;
    avg_sacks_against: number;
    avg_yards_lost_sacks: number;
    avg_rushing_yards: number;
    avg_rushing_attempts: number;
    redzone_conversion_pct: number;
    avg_penalties: number;
    avg_penalty_yards: number;
    avg_turnovers: number;
    avg_fumbles_lost: number;
    avg_passing_touchdowns: number;
    avg_rushing_touchdowns: number;
    avg_passer_rating: number;
    avg_tackles: number;
    avg_sacks: number;
    avg_tackles_for_loss: number;
    avg_passes_defended: number;
    avg_defensive_interceptions: number;
    avg_defensive_touchdowns: number;
    yards_per_kick_return: number;
    yards_per_punt_return: number;
    field_goal_pct: number;
    avg_field_goal_attempts: number;
    avg_punts: number;
    yards_per_punt: number;
    totals?: SeasonTotals;

}

/**
 * Helper object that holds totals for a season at a given point in time. These
 * stats won't be fed to ML model but are necessary for calculating the proportional
 * stats contained in `SeasonStats`.
 */
export interface SeasonTotals {
    third_down_attempts: number;
    third_down_conversions: number;
    fourth_down_attempts: number;
    fourth_down_conversions: number;
    completions: number;
    completion_attempts: number;
    red_zone_attempts: number;
    red_zone_conversions: number;
    kick_return_yards: number;
    kick_returns: number;
    punt_return_yards: number;
    punt_returns: number;
    rushing_attempts: number;
    field_goals_made: number;
    field_goals_attempted: number;
    punts: number;
    punt_yards: number;

}


export interface PartialEvent {
    id: number;
    home_team: number;
    away_team: number;
    season_year: number;
    week: number;
}


export type DelayLevel = 0 | 1 | 2 | 3;