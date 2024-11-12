export interface Team {
    id: number;
    uid: string;
    slug: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    color: string;
    alternateColor: string;
    isActive: boolean;
    isAllStar: boolean;
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
    team: Team;
    homeAway: boolean;
    winner: boolean | null;
    score: number;
    records: [Record, Record, Record];
    event_id?: number;
}


export interface Record {
    type: RecordType;
    summary: string;
}

export enum RecordType {
    HOME = "home",
    AWAY = "away",
    TOTAL = "total"
}