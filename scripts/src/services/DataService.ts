import {NFLEvent, Team, TeamRecord, Competition, Competitor, Boxscore} from "../models/models.d.js";
import {DataClient} from "../models/DataClient.js";
import {persist_events, persist_teams} from "../db/data_loading.js";
import {parseEventStatus} from "../utils/dataUtils.js";
import {formatISO9075} from "date-fns";
import {performance} from "perf_hooks";


export class DataService {
    private readonly NUM_YEARS_BACK = 20;
    private readonly ESTIMATED_EVENTS_PER_YEAR = 375;
    private readonly ESTIMATED_NUM_BOXSCORES = this.NUM_YEARS_BACK * this.ESTIMATED_EVENTS_PER_YEAR;
    private dataClient: DataClient;
    private teams: Team[] = [];
    private events: NFLEvent[] = new Array(this.ESTIMATED_EVENTS_PER_YEAR * this.NUM_YEARS_BACK);
    private eventCount = 0;
    private perfObserver: PerformanceObserver;
    private boxscoreResponses: Array<any>;
    private boxscores: Boxscore[];

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

    public static async build(dataClient: DataClient): Promise<DataService> {

        const ds = new DataService(dataClient);
        await ds.initialize();
        return ds;
    }

    public async initialize(): Promise<void> {
        performance.mark("fetch-teams-start");
        await this.fetchTeamData();
        performance.mark("fetch-teams-end");
        performance.mark("fetch-events-start");

        const eventRequests: Promise<void>[] = []
        for (let year = 2023; year >= 2023 - this.NUM_YEARS_BACK; year--) {
            eventRequests.push(this.fetchEventData(year.toString()));
        }
        console.log(eventRequests);
        await Promise.all(eventRequests);
        console.log(`Event count: ${this.eventCount}`);

        this.events = this.events.filter((event) => event != undefined);

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

    public async fetchBoxScores(): Promise<void> {
        const eventIds = this.events?.map((event) => event.id);
        console.log(`eventIds length: ${eventIds?.length}`);
        this.boxscoreResponses = await this.dataClient.getAllBoxScores(eventIds);
        console.log(this.boxscoreResponses);
        this.boxscores = this.boxscoreResponses.flatMap(DataService.parseBoxScores);


        console.log(`${this.boxscores.length} box scores fetched.`);
        console.log(this.boxscores[0]);
    }

    /**
     * parses the box score from a JSON response and returns an array of two `Boxscore` objects representing
     * the statistics of each of the two teams in a game
     * @param boxscoreJsonNode
     * @private
     */
    private static parseBoxScores(boxscoreJsonNode): [Boxscore, Boxscore] {
        const eventId = boxscoreJsonNode.eventId;
        const boxScores: [Boxscore, Boxscore] = [null, null];
        for (let i = 0; i < 2; i++) {
            const team = boxscoreJsonNode.teams[i];
            const player = boxscoreJsonNode.players[i];
            const {statistics} = team;
            const teamId = parseInt(team.team.id);

            const boxscoreObj: Boxscore = {
                eventId: eventId,
                teamId: teamId
            }

            DataService.parseTeamStatistics(statistics, boxscoreObj);
            DataService.parsePlayerStatistics(player, boxscoreObj);
            boxScores[i] = boxscoreObj;
        }
        return boxScores;
    }

    private static parseTeamStatistics(statistics: { name: string, displayValue: string }[], boxscore: Boxscore) {
        statistics.forEach(stat => {
            const {name, displayValue} = stat;
            if (name in DataService.teamStatsMap) {
                // console.log(`Parsing ${name} with value ${displayValue}`);
                DataService.teamStatsMap[name](displayValue, boxscore);
            }
        })
    }


    /**
     * parses team statistics obtained from the `player` JSON node in the boxscore JSON
     * @param player
     * @param boxscore
     * @private
     */
    private static parsePlayerStatistics(player: any, boxscore: Boxscore) {
        const mappedStats = DataService.flattenPlayerStatArrays(player.statistics);
        console.info(`Mapped stats: `, mappedStats);
        for (const key in mappedStats) {
            if (key in DataService.playerStatsMap) {
                console.log(`Parsing ${key} with value ${mappedStats[key]}`);
                DataService.playerStatsMap[key](mappedStats[key], boxscore);
            }
        }
    }

    /**
    in each member of the statistics array in each member of `boxscore.players` JSON, there is an array of
    keys and an array of values. this method combines those arrays into an array of objects, then flattens
    that array into a single object
     @param {Array} statistics - `statistics` array from the `player` JSON node in the boxscore JSON
     @return {Object} - an object with the following structure:

      {
        [statName]: statValue,
         ...
      }
     */
    private static flattenPlayerStatArrays(statistics: Array<any>): Object {
        return statistics
            .flatMap((statistic) => {
                console.log(`Statistic: `, statistic);
                return statistic.keys
                    .map((key, index) => {
                        if (statistic.totals.length == 0) return;
                        return {
                            key: key,
                            value: statistic.totals[index]
                        }
                    });
            })
            .filter((stat) => stat != undefined)
            .reduce((boxscore, stat) => {
                return (boxscore[stat.key] = stat.value, boxscore);
            }, {});
    }

    // private static parseStatistics(player: any, eventId: number): Boxscore {
    //     const stats = new Map();
    //     let totalStats = 0;
    //     let isNotFirstIter : 0 | 1 = 0;
    //
    //     //statistics are contained in an array of values, and an array that maps statistic
    //     //names to indexes in the values array
    //     const totals: string[] = player.statistics.flatMap((statistic: any) => {
    //         for (const index in statistic.keys){
    //             stats.set(statistic.keys[index], parseInt(index) + (totalStats++ * isNotFirstIter));
    //         }
    //         isNotFirstIter = 1;
    //         return statistic.totals;
    //     });
    //
    //
    // }

    /**
     * maps team statistic names to functions that parse their values, then sets their corresponding property
     * in `boxscore`
     * @private
     * @param value the value of the statistic
     * @param boxscore the boxscore object to which we want to assign the corresponding value
     */
    private static teamStatsMap: Record<string, (value: string, boxscore: Boxscore) => void> = {
        firstDowns: (value, boxscore) => boxscore.firstDowns = parseInt(value),
        firstDownsPassing: (value, boxscore) => boxscore.firstDownsPassing = parseInt(value),
        firstDownsRushing: (value, boxscore) => boxscore.firstDownsRushing = parseInt(value),
        firstDownsPenalty: (value, boxscore) => boxscore.firstDownsPenalty = parseInt(value),
        thirdDownEff: (value, boxscore) => {
            const [conversions, attempts] = value.split("-");
            boxscore.thirdDownConversions = parseInt(conversions);
            boxscore.thirdDownAttempts = parseInt(attempts);
        },
        fourthDownEff: (value, boxscore) => {
            const [conversions, attempts] = value.split("-");
            boxscore.fourthDownConversions = parseInt(conversions);
            boxscore.fourthDownAttempts = parseInt(attempts);
        },
        totalOffensivePlays: (value, boxscore) => boxscore.totalOffensivePlays = parseInt(value),
        totalYards: (value, boxscore) => boxscore.totalYards = parseInt(value),
        totalDrives: (value, boxscore) => boxscore.totalDrives = parseInt(value),
        netPassingYards: (value, boxscore) => boxscore.netPassingYards = parseInt(value),
        completionAttempts: (value, boxscore) => {
            const [completions, attempts] = value.split("/");
            boxscore.completions = parseInt(completions);
            boxscore.completionAttempts = parseInt(attempts);
        },
        interceptions: (value, boxscore) => boxscore.interceptionsThrown = parseInt(value),
        sacksYardsLost: (value, boxscore) => {
            const [sacks, yards] = value.split("-");
            boxscore.sacksAgainst = parseInt(sacks);
            boxscore.yardsLost = parseInt(yards);
        },
        rushingYards: (value, boxscore) => boxscore.rushingYards = parseInt(value),
        rushingAttempts: (value, boxscore) => boxscore.rushingAttempts = parseInt(value),
        redZoneAttempts: (value, boxscore) => {
            const [conversions, attempts] = value.split("-");
            boxscore.redZoneAttempts = parseInt(attempts);
            boxscore.redZoneConversions = parseInt(conversions);
        },
        totalPenaltiesYards: (value, boxscore) => {
            const [penalties, yards] = value.split("-");
            boxscore.penalties = parseInt(penalties);
            boxscore.penaltyYards = parseInt(yards);
        },
        turnovers: (value, boxscore) => boxscore.turnovers = parseInt(value),
        fumblesLost: (value, boxscore) => boxscore.fumblesLost = parseInt(value),
        defensiveTouchdowns: (value, boxscore) => boxscore.defensiveTouchdowns = parseInt(value)
    }

    /**
     * maps the names of team statistics gathered from the `player` JSON node
     * to functions that parse their values, then sets their corresponding property
     * in `boxscore`
     * @private
     * @param value the value of the statistic
     * @param boxscore the boxscore object to which we want to assign the corresponding value
     */
    private static playerStatsMap: Record<string, (value: string, boxscore: Boxscore) => void> = {
        passingTouchdowns: (value, boxscore) => boxscore.passingTouchdowns = parseInt(value),
        rushingTouchdowns: (value, boxscore) => boxscore.rushingTouchdowns = parseInt(value),
        passerRating: (value, boxscore) => boxscore.passerRating = parseFloat(value),
        tackles: (value, boxscore) => boxscore.tackles = parseInt(value),
        sacks: (value, boxscore) => boxscore.sacks = parseInt(value),
        tacklesForLoss: (value, boxscore) => boxscore.tacklesForLoss = parseInt(value),
        passesDefended: (value, boxscore) => boxscore.passesDefended = parseInt(value),
        interceptions: (value, boxscore) => boxscore.defensiveInterceptions = parseInt(value),
        defensiveTouchdowns: (value, boxscore) => boxscore.defensiveTouchdowns = parseInt(value),
        kickReturns: (value, boxscore) => boxscore.kickReturns = parseInt(value),
        kickReturnYards: (value, boxscore) => boxscore.kickReturnYards = parseInt(value),
        puntReturns: (value, boxscore) => boxscore.puntReturns = parseInt(value),
        puntReturnYards: (value, boxscore) => boxscore.puntReturnYards = parseInt(value),
        fieldGoalsMadeOverfieldGoalAttempts: (value, boxscore) => {
            const [made, attempts] = value.split("/");
            boxscore.fieldGoalsMade = parseInt(made);
            boxscore.fieldGoalsAttempted = parseInt(attempts);
        },
        punts: (value, boxscore) => boxscore.punts = parseInt(value),
        puntYards: (value, boxscore) => boxscore.puntYards = parseInt(value)
    }

    public getBoxScores(): Boxscore[] {
        return this.boxscores;
    }


    public getTeams(): Team[] {
        return this.teams;
    }

    public getEvents(): NFLEvent[] {
        return this.events;
    }

    public async fetchEventData(year: string): Promise<void> {
        const events = await this.dataClient.getAllEvents(year);
        // console.log(events);
        let iterCount = 0;

        for (let event of events) {
            // console.log("[DEBUG] Iteration: " + iterCount++);

            //ignore all-star games/teams
            if (!event.competitions[0].competitors[0].team.isActive) {
                continue;
            }
            this.events[this.eventCount++] = ({
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
                            venue: {id: event.competitions[0].venue?.id},
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
                                        } as TeamRecord,
                                        {
                                            type: event.competitions[0].competitors[0].records[1].type,
                                            summary: event.competitions[0].competitors[0].records[1].summary
                                        } as TeamRecord,
                                        {
                                            type: event.competitions[0].competitors[0].records[2].type,
                                            summary: event.competitions[0].competitors[0].records[2].summary
                                        } as TeamRecord
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
                                        } as TeamRecord,
                                        {
                                            type: event.competitions[0].competitors[1].records[1].type,
                                            summary: event.competitions[0].competitors[1].records[1].summary
                                        } as TeamRecord,
                                        {
                                            type: event.competitions[0].competitors[1].records[2].type,
                                            summary: event.competitions[0].competitors[1].records[2].summary
                                        } as TeamRecord
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