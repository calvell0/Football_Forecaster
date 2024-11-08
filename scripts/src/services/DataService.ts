import {NFLEvent, Team, Record, Competition, Competitor} from "../models/models.d.js";
import {DataClient} from "../models/DataClient.js";
import {persist_events, persist_teams} from "../db/data_loading.js";
import {parseEventStatus} from "../utils/dataUtils.js";
import {formatISO9075} from "date-fns";
import {performance} from "perf_hooks";


export class DataService {
    private dataClient: DataClient;
    private teams: Team[] = [];
    private events: NFLEvent[] = [];
    private perfObserver: PerformanceObserver;

    private constructor(dataClient: DataClient) {
        //initialize performance observer to log performance metrics
        this.perfObserver = new PerformanceObserver((items) => {
            items.getEntries().forEach((entry) => {
                console.log(`[PERFORMANCE] ${entry.name}: ${entry.duration}ms`);
            })
        });
        this.perfObserver.observe({entryTypes: ['measure'], buffered: true});

        this.dataClient = dataClient;
    }

    public static async build(dataClient: DataClient): Promise<DataService>{

        const ds = new DataService(dataClient);
        await ds.initialize();
        return ds;
    }

    public async initialize(): Promise<void> {
        performance.mark("fetch-teams-start");
        await this.fetchTeamData();
        performance.mark("fetch-teams-end");
        performance.mark("fetch-events-start");
        await this.fetchEventData();
        performance.mark("fetch-events-end");
        performance.measure("fetch-teams", "fetch-teams-start", "fetch-teams-end");
        performance.measure("fetch-events", "fetch-events-start", "fetch-events-end");
    }

    public async persistTeams(): Promise<void> {
        performance.mark("persist-teams-start");
        await persist_teams(this.teams);
        performance.mark("persist-teams-end");
        performance.measure("persist-teams", "persist-teams-start", "persist-teams-end");
    }

    public async persistEvents(): Promise<void> {
        performance.mark("persist-events-start");
        await persist_events(this.events);
        performance.mark("persist-events-end");
        performance.measure("persist-events", "persist-events-start", "persist-events-end");
    }

    public async fetchTeamData(): Promise<void> {
        const teamData = await this.dataClient.getAllTeams();
        // console.log(teamData);
        for (let team of teamData) {
            this.teams.push({
                id: parseInt(team.id),
                uid: team.uid,
                slug: team.slug,
                abbreviation: team.abbreviation,
                displayName: team.displayName,
                shortDisplayName: team.shortDisplayName,
                color: team.color,
                alternateColor: team.alternateColor,
                isActive: team.isActive,
                isAllStar: team.isAllStar,
                logos: team.logos.map((logo: any) => logo.href)
            } as Team);
        }

        return;
    }


    public getTeams(): Team[] {
        return this.teams;
    }

    public getEvents(): NFLEvent[] {
        return this.events;
    }

    public async fetchEventData(): Promise<void> {
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
                    id: parseInt(event.id),
                    uid: event.uid,
                    date: formatISO9075(event.date), //MySQL doesn't accept ISO8601 dates, which is what ESPN API uses
                    shortName: event.shortName,
                    season: {
                        year: event.season.year,
                        type: event.season.type
                    },
                    status: parseEventStatus(event.status.type.name),
                    competitions: [
                        {
                            id: parseInt(event.competitions[0].id),
                            uid: event.competitions[0].uid,
                            date: event.competitions[0].date,
                            timeValid: !!event.competitions[0].timeValid,
                            neutralSite: !!event.competitions[0].neutralSite,
                            conferenceCompetition: !!event.competitions[0].conferenceCompetition,
                            venue: {id: event.competitions[0].venue.id},
                            type: parseInt(event.competitions[0].type.id),
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

    public getGameById(id: number): NFLEvent {
        return this.events.find((game) => game.id === id);
    }

}