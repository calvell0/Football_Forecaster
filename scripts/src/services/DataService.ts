import {NFLEvent, Team, Record, Competition, Competitor} from "../models/models.d.js";
import {DataClient} from "../models/DataClient.js";
import { persist_teams } from "../db/data_loading.js";


export class DataService {
    private dataClient: DataClient;
    private teams: Team[] = [];
    private events: NFLEvent[] = [];


    private constructor(dataClient: DataClient) {
        this.dataClient = dataClient;
    }

    public static async build(dataClient: DataClient): Promise<DataService>{
        const ds = new DataService(dataClient);
        await ds.initialize();
        return ds;
    }

    public async initialize(): Promise<void> {
        this.teams = await this.dataClient.getAllTeams();
        await this.getRawEventData();
    }

    public async getRawTeamData(): Promise<void> {
        const teamData = await this.dataClient.getAllTeams();
        // console.log(teamData);
        for (let team of teamData) {
            this.teams.push({
                id: team.id,
                uid: team.uid,
                slug: team.slug,
                abbreviation: team.abbreviation,
                displayName: team.displayName,
                shortDisplayName: team.shortDisplayName,
                color: team.color,
                alternateColor: team.alternateColor,
                isActive: team.isActive,
                isAllStar: team.isAllStar
            } as Team);
        }

        return;
    }

    public async persistTeams(): Promise<void> {
        await persist_teams(this.teams);
    }

    public getTeams(): Team[] {
        return this.teams;
    }

    public getEvents(): NFLEvent[] {
        return this.events;
    }

    public async getRawEventData(): Promise<void> {
        const events = await this.dataClient.getAllEvents();
        // console.log(events);
        let iterCount = 0;

        for (let event of events) {
            // console.log("[DEBUG] Iteration: " + iterCount++);

            //ignore all-star games/teams
            if (!event.competitions[0].competitors[0].team.isActive) {
                continue;
            }
            this.events.push({
                    id: event.id,
                    uid: event.uid,
                    date: event.date,
                    shortName: event.shortName,
                    season: {
                        year: event.season.year,
                        type: event.season.type
                    },
                    competitions: [
                        {
                            id: event.competitions[0].id,
                            uid: event.competitions[0].uid,
                            date: event.competitions[0].date,
                            competitionType: event.competitions[0].competitionType,
                            timeValid: !!event.competitions[0].timeValid,
                            neutralSite: !!event.competitions[0].neutralSite,
                            conferenceCompetition: !!event.competitions[0].conferenceCompetition,
                            venue: {id: event.competitions[0].venue.id},
                            competitors: [
                                {
                                    team: this.getTeamByUid(event.competitions[0].competitors[0].team.uid),
                                    homeAway: !!event.competitions[0].competitors[0].homeAway,
                                    winner: !!event.competitions[0].competitors[0].winner,
                                    score: event.competitions[0].competitors[0].score,
                                    records: [
                                        {
                                            type: event.competitions[0].competitors[0].records[0].type,
                                            summary: event.competitions[0].competitors[0].records[0].summary
                                        } as Record,
                                        {
                                            type: event.competitions[0].competitors[0].records[1].type,
                                            summary: event.competitions[0].competitors[0].records[1].summary
                                        } as Record,
                                        {
                                            type: event.competitions[0].competitors[0].records[2].type,
                                            summary: event.competitions[0].competitors[0].records[2].summary
                                        } as Record
                                    ]
                                } as Competitor,
                                {
                                    team: this.getTeamByUid(event.competitions[0].competitors[1].team.uid),
                                    homeAway: !!event.competitions[0].competitors[1].homeAway,
                                    winner: !!event.competitions[0].competitors[1].winner,
                                    score: event.competitions[0].competitors[1].score,
                                    records: [
                                        {
                                            type: event.competitions[0].competitors[1].records[0].type,
                                            summary: event.competitions[0].competitors[1].records[0].summary
                                        } as Record,
                                        {
                                            type: event.competitions[0].competitors[1].records[1].type,
                                            summary: event.competitions[0].competitors[1].records[1].summary
                                        } as Record,
                                        {
                                            type: event.competitions[0].competitors[1].records[2].type,
                                            summary: event.competitions[0].competitors[1].records[2].summary
                                        } as Record
                                    ]
                                } as Competitor
                            ]
                        } as Competition
                    ]
                } as NFLEvent
            );
        }
    }

    public getTeamByUid(uid: string): Team {
        return this.teams.find((team) => team.uid === uid);
    }

    public getGameById(id: string): NFLEvent {
        return this.events.find((game) => game.id === id);
    }

}