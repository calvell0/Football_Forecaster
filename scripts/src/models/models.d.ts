export interface Team {
    id: string;
    uid: string;
    slug: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    color: string;
    alternateColor: string;
    isActive: boolean;
    isAllStar: boolean;
}

export interface TeamResponseObject {
    team: Team;
}
export interface NFLEventResponseObject {

}

export interface NFLEvent {

    id: string;
    uid: string;
    date: string;
    shortName: string;
    season: Season;
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

export interface Competition{
    id: string;
    uid: string;
    date: string;
    competitionType: string;
    timeValid: boolean;
    neutralSite: boolean;
    conferenceCompetition: boolean;
    venue: Venue;
    competitors: [Competitor, Competitor];
}

export interface Venue {
    id: string;
}

export interface Competitor {
    team: Team;
    homeAway: boolean;
    winner: boolean;
    score: number;
    records: [Record, Record, Record];
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