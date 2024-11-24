import {NFLEvent, Team, TeamRecord, Competition, Competitor, Boxscore} from "../models/models.d.js";
import {DataClient} from "../models/DataClient.js";
import {persist_boxscores, persist_events, persist_teams} from "../db/data_loading.js";
import {parseEventStatus} from "../utils/dataUtils.js";
import {formatISO9075} from "date-fns";
import {performance} from "perf_hooks";
import {sleep} from "../utils/generalUtils.js";

//TODO: maybe refactor a separate JSONObjectMapper class to handle JSON parsing


export class DataService {
    private readonly NUM_YEARS_BACK = 16; // data gets funky and inconsistent more than 16 years back
    private readonly ESTIMATED_EVENTS_PER_YEAR = 375;
    private readonly ESTIMATED_NUM_BOXSCORES = this.NUM_YEARS_BACK * this.ESTIMATED_EVENTS_PER_YEAR;
    private dataClient: DataClient;
    private teams: Team[] = [];
    private events: NFLEvent[] = new Array<NFLEvent>(this.ESTIMATED_EVENTS_PER_YEAR * this.NUM_YEARS_BACK);
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

    public static async build(dataClient: DataClient, preserveDB: boolean = false): Promise<DataService> {

        const ds = new DataService(dataClient);
        preserveDB || await ds.initialize(); //populate events and teams if --preserve-db is not passed
        return ds;
    }

    public async initialize(): Promise<void> {
        performance.mark("fetch-teams-start");
        await this.fetchTeamData();
        performance.mark("fetch-teams-end");
        performance.mark("fetch-events-start");



        await this.fetchEventData();
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

    public async persistBoxScores(): Promise<void> {
        performance.mark("persist-boxscores-start");
        await persist_boxscores(this.boxscores);
        performance.mark("persist-boxscores-end");
        performance.measure("persist-boxscores", "persist-boxscores-start", "persist-boxscores-end");
    }

    public async fetchTeamData(): Promise<void> {
        const teamData = await this.dataClient.getAllTeams();
        this.teams = this.parseTeamData(teamData);

        return;
    }

    public async createSeasonStats(){

    }



    public async fetchEventData(): Promise<void> {
        const events = await this.dataClient.getPastEvents(this.NUM_YEARS_BACK);
        // console.log(events);
        this.parseEventData(events);
    }

    private parseEventData(events) {
        this.eventCount = 0;


        for (let event of events) {
            // console.log("[DEBUG] Iteration: " + iterCount++);

            //ignore all-star games/teams and preseason games
            if (!event.competitions[0].competitors[0].team.isActive || event.season.type == 1) {
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
                    week: event.week.number,
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
                                    teamId: parseInt(event.competitions[0].competitors[0].team.id),
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
                                    teamId: parseInt(event.competitions[0].competitors[1].team.id),
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

    public async fetchBoxScores(): Promise<void> {
        const eventIds = this.events?.map((event) => event.id);
        console.log(`eventIds length: ${eventIds?.length}`);
        this.boxscoreResponses = await this.dataClient.getAllBoxScores(eventIds);
        // console.log(this.boxscoreResponses);

        //each call to parseBoxScores returns an array of 2 Boxscores, this calls parseBoxScores for each
        //boxscore response and flattens the resulting array of arrays into a single array
        this.boxscores = this.boxscoreResponses.flatMap(DataService.parseBoxScores);


        console.log(`${this.boxscores.length} box scores fetched.`);
        // console.log(this.boxscores[0]);
    }

    private parseTeamData(teamData): Team[] {
        return teamData.map((team)=> {
            return ({
                id: parseInt(team.id),
                uid: team.uid,
                slug: team.slug,
                abbreviation: team.abbreviation,
                display_name: team.displayName,
                short_display_name: team.shortDisplayName,
                color: team.color,
                alternate_color: team.alternateColor,
                is_active: team.isActive,
                is_all_star: team.isAllStar,
                logos: team.logos.map((logo: any) => logo.href)
            } as Team);
        });

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
                event_id: eventId,
                team_id: teamId
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
        //@ts-ignore
        // if (!mappedStats.kickReturns) console.log(`No kick stats for event ${boxscore.eventId} `, mappedStats);
        for (const key in mappedStats) {
            if (key in DataService.playerStatsMap) {
                // console.log(`Parsing ${key} with value ${mappedStats[key]}`);
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

     // [ [ 1, 2 ], [ 3, 4] ] => [ 1, 2, 3, 4 ]
     */
    private static flattenPlayerStatArrays(statistics: Array<any>): Object {
        return statistics
            .flatMap((statistic) => {
                return statistic.keys
                    .map((key, index) => {
                        if (!statistic.totals || statistic.totals.length == 0) return undefined;
                        if (statistic.totals.length !== statistic.keys.length && statistic.keys.length > 0) {
                            //sometimes the totals array is missing a value for adjQBR so we insert a dummy element here
                            statistic.totals.splice(6, 0, "");
                        }

                        return {
                            key: key.replace(/[/\-]/, "Over"), //replace slashes or dashes in stat names
                            value: statistic.totals[index]
                        }
                    });
            })
            .filter((stat) => stat != undefined)
            .reduce((boxscore, stat) => {
                return (boxscore[stat.key] = stat.value, boxscore); // weird comma expression makes this more efficient
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
        firstDowns: (value, boxscore) => boxscore.first_downs = parseInt(value),
        firstDownsPassing: (value, boxscore) => boxscore.first_downs_passing = parseInt(value),
        firstDownsRushing: (value, boxscore) => boxscore.first_downs_rushing = parseInt(value),
        firstDownsPenalty: (value, boxscore) => boxscore.first_downs_penalty = parseInt(value),
        thirdDownEff: (value, boxscore) => {
            const [conversions, attempts] = value.split("-");
            boxscore.third_down_conversions = parseInt(conversions);
            boxscore.third_down_attempts = parseInt(attempts);
        },
        fourthDownEff: (value, boxscore) => {
            const [conversions, attempts] = value.split("-");
            boxscore.fourth_down_conversions = parseInt(conversions);
            boxscore.fourth_down_attempts = parseInt(attempts);
        },
        totalOffensivePlays: (value, boxscore) => boxscore.total_offensive_plays = parseInt(value),
        totalYards: (value, boxscore) => boxscore.total_offensive_yards = parseInt(value),
        totalDrives: (value, boxscore) => boxscore.total_drives = parseInt(value),
        netPassingYards: (value, boxscore) => boxscore.net_passing_yards = parseInt(value),
        completionAttempts: (value, boxscore) => {
            const [completions, attempts] = value.split("/");
            boxscore.completions = parseInt(completions);
            boxscore.completion_attempts = parseInt(attempts);
        },
        interceptions: (value, boxscore) => boxscore.interceptions_thrown = parseInt(value),
        sacksYardsLost: (value, boxscore) => {
            const [sacks, yards] = value.split("-");
            boxscore.sacks_against = parseInt(sacks);
            boxscore.yards_lost = parseInt(yards);
        },
        rushingYards: (value, boxscore) => boxscore.rushing_yards = parseInt(value),
        rushingAttempts: (value, boxscore) => boxscore.rushing_attempts = parseInt(value),
        redZoneAttempts: (value, boxscore) => {
            const [conversions, attempts] = value.split("-");
            boxscore.red_zone_attempts = parseInt(attempts);
            boxscore.red_zone_conversions = parseInt(conversions);
        },
        totalPenaltiesYards: (value, boxscore) => {
            const [penalties, yards] = value.split("-");
            boxscore.penalties = parseInt(penalties);
            boxscore.penalty_yards = parseInt(yards);
        },
        turnovers: (value, boxscore) => boxscore.turnovers = parseInt(value),
        fumblesLost: (value, boxscore) => boxscore.fumbles_lost = parseInt(value),
        defensiveTouchdowns: (value, boxscore) => boxscore.defensive_touchdowns = parseInt(value)
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
        passingTouchdowns: (value, boxscore) => boxscore.passing_touchdowns = parseInt(value),
        rushingTouchdowns: (value, boxscore) => boxscore.rushing_touchdowns = parseInt(value),
        QBRating: (value, boxscore) => boxscore.passer_rating = parseFloat(value) || null,
        totalTackles: (value, boxscore) => boxscore.tackles = parseInt(value),
        sacks: (value, boxscore) => boxscore.sacks = parseInt(value),
        tacklesForLoss: (value, boxscore) => boxscore.tackles_for_loss = parseInt(value),
        passesDefended: (value, boxscore) => boxscore.passes_defended = parseInt(value),
        interceptions: (value, boxscore) => boxscore.defensive_interceptions = parseInt(value),
        defensiveTouchdowns: (value, boxscore) => boxscore.defensive_touchdowns = parseInt(value),
        kickReturns: (value, boxscore) => boxscore.kick_returns = parseInt(value) || 0,
        kickReturnYards: (value, boxscore) => boxscore.kick_return_yards = parseInt(value) || 0,
        puntReturns: (value, boxscore) => boxscore.punt_returns = parseInt(value) || 0,
        puntReturnYards: (value, boxscore) => boxscore.punt_return_yards = parseInt(value) || 0,
        fieldGoalsMadeOverfieldGoalAttempts: (value, boxscore) => {
            const [made, attempts] = value.split("/");
            boxscore.field_goals_made = parseInt(made);
            boxscore.field_goals_attempted = parseInt(attempts);
        },
        punts: (value, boxscore) => boxscore.punts = parseInt(value),
        puntYards: (value, boxscore) => boxscore.punt_yards = parseInt(value)
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




    public getTeamByUid(uid: string): Team {
        return this.teams.find((team) => team.uid === uid);
    }

    public getGameById(id: number): NFLEvent {
        return this.events.find((game) => game.id === id);
    }

}