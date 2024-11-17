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
    eventId: number;
    teamId: number;
    firstDowns?: number;
    firstDownsPassing?: number;
    firstDownsRushing?: number;
    firstDownsPenalty?: number;
    thirdDownConversions?: number;
    thirdDownAttempts?: number;
    fourthDownConversions?: number;
    fourthDownAttempts?: number;
    totalOffensivePlays?: number;
    totalYards?: number;
    totalDrives?: number;
    netPassingYards?: number;
    completions?: number;
    completionAttempts?: number;
    interceptionsThrown?: number;
    sacksAgainst?: number;
    yardsLost?: number;
    rushingYards?: number;
    rushingAttempts?: number;
    redZoneAttempts?: number;
    redZoneConversions?: number;
    penalties?: number;
    penaltyYards?: number;
    turnovers?: number;
    fumblesLost?: number;
    passingTouchdowns?: number;
    rushingTouchdowns?: number;
    passerRating?: number;
    tackles?: number;
    sacks?: number;
    tacklesForLoss?: number;
    passesDefended?: number;
    defensiveInterceptions?: number;
    defensiveTouchdowns?: number;
    kickReturns?: number;
    kickReturnYards?: number;
    puntReturns?: number;
    puntReturnYards?: number;
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    punts?: number;
    puntYards?: number;
}

//TODO: finish this
export interface BoxScore {
    event_id: number;
    team_id: number;

}