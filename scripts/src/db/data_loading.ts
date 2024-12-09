import {connect} from './initialize_database.js';
import {Boxscore, BoxscoreEventJoin, Competitor, NFLEvent, PartialEvent, SeasonStats, Team} from "../models/models.js";
import mysql from 'mysql2';
import {parseRecords} from "../utils/dataUtils.js";
import fs from "fs";


export const persist_teams = async (teams: Team[]) => {
    const host = await connect();
    await host.query(`INSERT INTO Team
                      (id, uid, abbreviation, display_name, short_display_name, color, alternate_color, is_active,
                       is_all_star)
                      VALUES ?`,
        [ //mysql2 accepts batch inserts as a double-nested array
            teams.map(team =>
                [
                    team.id, team.uid, team.abbreviation, team.display_name,
                    team.short_display_name, team.color, team.alternate_color, team.is_active, team.is_all_star
                ]
            )
        ]
    );

    await host.query(`
                INSERT INTO Logo (team_id, href)
                VALUES ?`,
        [ //mysql2 accepts batch inserts as a double-nested array
            teams.map(team =>
                team.logos.map((href: string) => [team.id, href])
            ).flat(1)
        ]
    );

    await host.end();
}

export const persist_events = async (eventsList: NFLEvent[]) => {

    const BATCH_SIZE = 100;
    const host = await connect();

    let iterCount = 0;

    for (let i = 0; i < eventsList.length; i += BATCH_SIZE) {

        //create a batch of events
        let events = eventsList.slice(i, Math.min(i + BATCH_SIZE, eventsList.length));

        await host.query(`INSERT INTO NFL_Event
                          (id, uid, date, short_name, season_year, week,
                           competition_type, conference_competition,
                           neutral_site, status, home_team, away_team)
                          VALUES ?`,
            [ //mysql accepts batch inserts as a double-nested array
                events.map(event =>
                    [
                        event.id, event.uid, event.date, event.shortName, event.season.year, event.week, event.competitions[0].type,
                        event.competitions[0].conferenceCompetition, event.competitions[0].neutralSite, event.status,
                        event.competitions[0].competitors[0].teamId, event.competitions[0].competitors[1].teamId
                    ]
                )
            ]
        );

        /*
            Insert competitors into competitor table:
            Create a new array of Competitor objects from event array, since there are
            2 Competitors per event.
            Then, batch insert Competitors into Competitor table.
         */

        const competitors: Competitor[] = new Array<Competitor>(events.length * 2);
        let compIdx = 0;

        events.forEach(event => {
            event.competitions[0].competitors.forEach(competitor => {
                competitor.event_id = event.id;
                competitors[compIdx++] = competitor;
            });

        });

        await host.query(`
                    INSERT INTO Competitor (team_id, event_id, winner, home_wins, home_losses, away_wins, away_losses)
                    VALUES ?`,
            [ //mysql accepts batch inserts as a double-nested array
                competitors.map(competitor => {

                        const [oWins, oLosses, hWins, hLosses, aWins, aLosses] = parseRecords(competitor.records);
                        return [
                            competitor.teamId, competitor.event_id, competitor.winner, hWins, hLosses, aWins, aLosses
                        ]
                    }
                )
            ]
        );
    }
    console.info(`[INFO] ${eventsList.length} events inserted in ${iterCount} batches.`);

    await host.end();
}


export const persist_boxscores = async (boxscores: Boxscore[]) => {

    const BATCH_SIZE = 100;
    let batchNumber = 0;
    const host = await connect();
    const queries: Promise<[mysql.QueryResult, mysql.FieldPacket[]]>[] = new Array<Promise<any>>(Math.ceil(boxscores.length / BATCH_SIZE));

    for (let i = 0; i < boxscores.length; i += BATCH_SIZE) {

        let boxscoreBatch = boxscores.slice(i, Math.min(i + BATCH_SIZE, boxscores.length));



        queries[batchNumber++] = host.query(`
                    INSERT INTO Boxscore
                    (event_id, team_id, first_downs, first_downs_passing, first_downs_rushing, first_downs_penalty,
                     third_down_conversions, third_down_attempts, fourth_down_conversions, fourth_down_attempts,
                     total_offensive_plays, total_offensive_yards, total_drives, completions, completion_attempts,
                     interceptions_thrown, sacks_against, yards_lost, rushing_yards, rushing_attempts, red_zone_attempts,
                     red_zone_conversions, penalties, penalty_yards, turnovers, fumbles_lost, passing_touchdowns,
                     rushing_touchdowns, passer_rating, tackles, sacks, tackles_for_loss, passes_defended,
                     defensive_interceptions, defensive_touchdowns, kick_returns, kick_return_yards, punt_returns,
                     punt_return_yards, field_goals_made, field_goals_attempted, punts, punt_yards)
                    VALUES ?`,
            [ // mysql2 accepts batch inserts as a double-nested array
                boxscoreBatch.map(boxscore => [
                    boxscore.event_id, boxscore.team_id, boxscore.first_downs, boxscore.first_downs_passing,
                    boxscore.first_downs_rushing, boxscore.first_downs_penalty, boxscore.third_down_conversions,
                    boxscore.third_down_attempts, boxscore.fourth_down_conversions, boxscore.fourth_down_attempts,
                    boxscore.total_offensive_plays, boxscore.total_offensive_yards, boxscore.total_drives,
                    boxscore.completions, boxscore.completion_attempts, boxscore.interceptions_thrown,
                    boxscore.sacks_against, boxscore.yards_lost, boxscore.rushing_yards, boxscore.rushing_attempts,
                    boxscore.red_zone_attempts, boxscore.red_zone_conversions, boxscore.penalties,
                    boxscore.penalty_yards, boxscore.turnovers, boxscore.fumbles_lost, boxscore.passing_touchdowns,
                    boxscore.rushing_touchdowns, boxscore.passer_rating, boxscore.tackles, boxscore.sacks,
                    boxscore.tackles_for_loss, boxscore.passes_defended, boxscore.defensive_interceptions,
                    boxscore.defensive_touchdowns, boxscore.kick_returns || 0, boxscore.kick_return_yards || 0,
                    boxscore.punt_returns || 0, boxscore.punt_return_yards || 0, boxscore.field_goals_made || 0,
                    boxscore.field_goals_attempted || 0, boxscore.punts || 0, boxscore.punt_yards || 0
                ])
            ]
        );


    }
    await Promise.all(queries).then((results) => {
        console.info(`[INFO] ${results.length} batches of boxscores inserted.`);
    }).catch(error => {
        console.error(`[ERROR] Error persisting boxscores: `, error);
    });

    await host.end();
}

export const persist_seasonstats = async (seasonStats: SeasonStats[]) => {
    const BATCH_SIZE = 100;
    let batchNumber = 0;
    const host = await connect();
    const queries: Promise<[mysql.QueryResult, mysql.FieldPacket[]]>[] = new Array<Promise<any>>(Math.ceil(seasonStats.length / BATCH_SIZE));

    console.log("------------------------------------");
    console.log();
    console.log("[INFO] SEASON STATS PRE-PERSIST: ", seasonStats.filter(stat => stat == undefined));
    console.log();
    console.log("------------------------------------");
    for (let i = 0; i < seasonStats.length; i += BATCH_SIZE) {
        let seasonStatsBatch = seasonStats
            .slice(i, Math.min(i + BATCH_SIZE, seasonStats.length))
            .map((stat, index, arr) => {
                if (!stat) console.log("[ERROR] Undefined season stat, batch: ", arr);
                return stat;
            })
            .filter(stat => stat != undefined);
        queries[batchNumber++] = host.query(`
            INSERT INTO season_stats
            (event_id, team_id, avg_first_downs, avg_first_downs_passing, avg_first_downs_rushing, avg_first_downs_penalty,
             third_down_conversion_pct, fourth_down_conversion_pct, avg_offensive_plays, avg_offensive_yards, avg_drives,
             completion_pct, avg_interceptions, avg_sacks_against, avg_yards_lost_sacks, avg_rushing_yards, avg_rushing_attempts,
             redzone_conversion_pct, avg_penalties, avg_penalty_yards, avg_turnovers, avg_fumbles_lost, avg_passing_touchdowns,
             avg_rushing_touchdowns, avg_passer_rating, avg_tackles, avg_sacks, avg_tackles_for_loss, avg_passes_defended,
             avg_defensive_interceptions, avg_defensive_touchdowns, yards_per_kick_return, yards_per_punt_return, field_goal_pct,
             avg_field_goal_attempts, avg_punts, yards_per_punt)
            VALUES ?`,
            [seasonStatsBatch.map(stat => [
                stat.event_id, stat.team_id, stat.avg_first_downs, stat.avg_first_downs_passing, stat.avg_first_downs_rushing,
                stat.avg_first_downs_penalty, stat.third_down_conversion_pct, stat.fourth_down_conversion_pct, stat.avg_offensive_plays,
                stat.avg_offensive_yards, stat.avg_drives, stat.completion_pct, stat.avg_interceptions, stat.avg_sacks_against,
                stat.avg_yards_lost_sacks, stat.avg_rushing_yards, stat.avg_rushing_attempts, stat.redzone_conversion_pct,
                stat.avg_penalties, stat.avg_penalty_yards, stat.avg_turnovers, stat.avg_fumbles_lost, stat.avg_passing_touchdowns,
                stat.avg_rushing_touchdowns, stat.avg_passer_rating, stat.avg_tackles, stat.avg_sacks, stat.avg_tackles_for_loss,
                stat.avg_passes_defended, stat.avg_defensive_interceptions, stat.avg_defensive_touchdowns, stat.yards_per_kick_return,
                stat.yards_per_punt_return, stat.field_goal_pct, stat.avg_field_goal_attempts, stat.avg_punts, stat.yards_per_punt
            ])]
        );
    }

    await Promise.all(queries).then((results) => {
        console.info(`[INFO] ${results.length} batches of season stats inserted.`);
    }).catch(error => {
        console.error(`[ERROR] Error persisting season stats: `, error);
    });

    await host.end();
}


export const getBoxScores = async (): Promise<BoxscoreEventJoin[]> => {
    const host = await connect();
    const [ results, fields ] = await host.query(`
        SELECT e.date, e.season_year, e.week, b.* FROM Boxscore b JOIN nfl_data.nfl_event e on b.event_id = e.id;
        `);

    await host.end();
    return results as BoxscoreEventJoin[];
}

export const getEvents = async (): Promise<PartialEvent[]> => {
    const host = await connect();
    const [ results, fields ] = await host.query(`
        SELECT id, home_team, away_team, season_year, week FROM NFL_Event
        WHERE status = 'STATUS_FINAL';
        `);

    await host.end();
    return results as PartialEvent[];
}

export const getTeams = async (): Promise<Team[]> => {
    const host = await connect();
    const [ results, fields ] = await host.query(`
        SELECT * FROM Team
        `);

    await host.end();
    return results as Team[];
}

export const export_training_data = async (output_path: string) => {

    const host = await connect();
    const [rows, fields]: [any[], mysql.FieldPacket[]] = await host.execute('SELECT * FROM competitoreventstats');

    const columnNames = fields.map(field => field.name).join(',');

    let csvData = rows.map((row) =>
        Object.values(row).map(value => {
            if (Buffer.isBuffer(value)) {
                //boolean values in mysql are stored as a 2-bit buffer. Here we convert that buffer to a 1 or 0
                return value[0] === 1 ? 1 : 0;
            }
            return typeof value === 'boolean' ? (value ? 1 : 0) : value;
        }).join(',')
    ).join('\n');

    csvData = `${columnNames}\n${csvData}`;

    fs.mkdirSync(output_path.substring(0, output_path.lastIndexOf('\\')), { recursive: true });
    fs.writeFileSync(output_path, csvData);
    console.log(`Export complete. Data saved to ${output_path}`);
    await host.end();
    return;
}

