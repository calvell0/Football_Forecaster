import {getBoxScores, getEvents, getTeams} from "../db/data_loading.js";
import {
    Boxscore,
    BoxscoreEventJoin,
    NFLEvent,
    PartialEvent,
    SeasonStats,
    SeasonTotals,
    Team
} from "../models/models.js";


export const calculateSeasonStats = async (): Promise<SeasonStats[]> => {
    let boxscores: BoxscoreEventJoin[] = await getBoxScores();
    const teams = await getTeams();
    let seasonStats: SeasonStats[];

    boxscores.sort((a, b) => {
        return a.season_year - b.season_year;
    });


    const promises: Promise<SeasonStats[]>[] = [];

    for (let i = 2023; i > 2007; i--) {
        const seasonBoxscores = boxscores.filter(boxscore => boxscore.season_year === i);
        if (!seasonBoxscores || seasonBoxscores.length === 0) continue;
        promises.push(extractBoxscores(teams, seasonBoxscores));
    }

    console.log("[PROMISES] : ", promises);

    const stats = await Promise.all(promises).then((stats) => {
        return stats;
    });
    seasonStats = stats.flat();

    return seasonStats;
}

const extractBoxscores = async (teams: Team[], boxscores: BoxscoreEventJoin[]): Promise<SeasonStats[]> => {
    if (boxscores?.length === 0) return;

    const stats =
        teams.flatMap(team => {


            const teamBoxscores: BoxscoreEventJoin[] = boxscores
                .filter(boxscore => boxscore.team_id === team.id)
                .sort((a, b) => {
                    return a.week - b.week;
                })
                .map((boxscore, index) => {
                    return {
                        ...boxscore,
                        game_num: index + 1
                    }
                });


            const NUM_GAMES = teamBoxscores.length;

            const seasonStats: SeasonStats[] = new Array<SeasonStats>(NUM_GAMES);

            /*teamBoxscores = all boxscores for one team in one season
            cumulativeStats: SeasonStats = null;
            for each boxscore:
                cumulativeStats = sumStats(cumulativeStats, boxscore, index)
                seasonStats[index] = cumulativeStats;
             */
            let cumulativeStats: SeasonStats = getInitializedSeasonStats();


            // console.log("initial cumulativeStats: ", cumulativeStats);



            for (let i = 0; i < teamBoxscores.length; i++){

                cumulativeStats = sumStats(cumulativeStats, teamBoxscores[i], i);
                // create new object so array doesn't have multiple references to the same object
                seasonStats[i] = { ...cumulativeStats };

            }



            console.log("Season Stats: ", seasonStats?.length);
            return seasonStats;

        });

    return stats;
}

const sumStats = (cumulative: SeasonStats, next: BoxscoreEventJoin, gameNum: number): SeasonStats => {


    cumulative.event_id = next.event_id;
    cumulative.team_id = next.team_id;
    setTotals(cumulative.totals, next);

    //iterate over all properties in cumulative and call the appropriate function in sumStatMap
    //to update season stats according to the newest boxscore
    for (let prop in cumulative) {
        if (prop !== "event_id" && prop !== "team_id" && sumStatMap[prop]) {

            try {
                sumStatMap[prop](cumulative, next);
            } catch (e) {
                console.log("Error in sumStatMap: ", e);
                console.log("next: ", next, "cumulative", cumulative);
                throw new Error(e);
            }
        }
    }
    return cumulative;
}

const sumStatMap: Record<string, (cumulativeStat: SeasonStats, newStat: BoxscoreEventJoin) => void> = {
    avg_first_downs: (cumulativeStat, newStat) => {
        cumulativeStat.avg_first_downs = recalculateMean(cumulativeStat.avg_first_downs, newStat.first_downs, newStat.game_num);
    },
    avg_first_downs_passing: (cumulativeStat, newStat) => {
        cumulativeStat.avg_first_downs_passing = recalculateMean(cumulativeStat.avg_first_downs_passing, newStat.first_downs_passing, newStat.game_num);
    },
    avg_first_downs_rushing: (cumulativeStat, newStat) => {
        cumulativeStat.avg_first_downs_rushing = recalculateMean(cumulativeStat.avg_first_downs_rushing, newStat.first_downs_rushing, newStat.game_num);
    },
    avg_first_downs_penalty: (cumulativeStat, newStat) => {
        cumulativeStat.avg_first_downs_penalty = recalculateMean(cumulativeStat.avg_first_downs_penalty, newStat.first_downs_penalty, newStat.game_num);
    },
    third_down_conversion_pct: (cumulativeStat, newStat) => {
        cumulativeStat.third_down_conversion_pct = recalculatePct(cumulativeStat.totals.third_down_conversions, cumulativeStat.totals.third_down_attempts);
    },
    fourth_down_conversion_pct: (cumulativeStat, newStat) => {
        cumulativeStat.fourth_down_conversion_pct = recalculatePct(cumulativeStat.totals.fourth_down_conversions, cumulativeStat.totals.fourth_down_attempts);
    },
    avg_offensive_plays: (cumulativeStat, newStat) => {
        // console.log("avg_off_plays: ", cumulativeStat, newStat);
        cumulativeStat.avg_offensive_plays = recalculateMean(cumulativeStat.avg_offensive_plays, newStat.total_offensive_plays, newStat.game_num);
    },
    avg_offensive_yards: (cumulativeStat, newStat) => {
        cumulativeStat.avg_offensive_yards = recalculateMean(cumulativeStat.avg_offensive_yards, newStat.total_offensive_yards, newStat.game_num);
    },
    avg_drives: (cumulativeStat, newStat) => {
        cumulativeStat.avg_drives = recalculateMean(cumulativeStat.avg_drives, newStat.total_drives, newStat.game_num);
    },
    avg_completion_pct: (cumulativeStat, newStat) => {
        cumulativeStat.completion_pct = recalculatePct(cumulativeStat.totals.completions, cumulativeStat.totals.completion_attempts);
    },
    avg_interceptions: (cumulativeStat, newStat) => {
        cumulativeStat.avg_interceptions = recalculateMean(cumulativeStat.avg_interceptions, newStat.interceptions_thrown, newStat.game_num);
    },
    avg_sacks_against: (cumulativeStat, newStat) => {
        cumulativeStat.avg_sacks_against = recalculateMean(cumulativeStat.avg_sacks_against, newStat.sacks_against, newStat.game_num);
    },
    avg_yards_lost_sacks: (cumulativeStat, newStat) => {
        cumulativeStat.avg_yards_lost_sacks = recalculateMean(cumulativeStat.avg_yards_lost_sacks, newStat.yards_lost, newStat.game_num);
    },
    avg_rushing_yards: (cumulativeStat, newStat) => {
        cumulativeStat.avg_rushing_yards = recalculateMean(cumulativeStat.avg_rushing_yards, newStat.rushing_yards, newStat.game_num);
    },
    avg_rushing_attempts: (cumulativeStat, newStat) => {
        cumulativeStat.avg_rushing_attempts = recalculateMean(cumulativeStat.avg_rushing_attempts, newStat.rushing_attempts, newStat.game_num);
    },
    redzone_conversion_pct: (cumulativeStat, newStat) => {
        cumulativeStat.redzone_conversion_pct = recalculatePct(cumulativeStat.totals.red_zone_conversions, cumulativeStat.totals.red_zone_attempts);
    },
    avg_penalties: (cumulativeStat, newStat) => {
        cumulativeStat.avg_penalties = recalculateMean(cumulativeStat.avg_penalties, newStat.penalties, newStat.game_num);
    },
    avg_penalty_yards: (cumulativeStat, newStat) => {
        cumulativeStat.avg_penalty_yards = recalculateMean(cumulativeStat.avg_penalty_yards, newStat.penalty_yards, newStat.game_num);
    },
    avg_turnovers: (cumulativeStat, newStat) => {
        cumulativeStat.avg_turnovers = recalculateMean(cumulativeStat.avg_turnovers, newStat.turnovers, newStat.game_num);
    },
    avg_fumbles_lost: (cumulativeStat, newStat) => {
        cumulativeStat.avg_fumbles_lost = recalculateMean(cumulativeStat.avg_fumbles_lost, newStat.fumbles_lost, newStat.game_num);
    },
    avg_passing_touchdowns: (cumulativeStat, newStat) => {
        cumulativeStat.avg_passing_touchdowns = recalculateMean(cumulativeStat.avg_passing_touchdowns, newStat.passing_touchdowns, newStat.game_num);
    },
    avg_rushing_touchdowns: (cumulativeStat, newStat) => {
        cumulativeStat.avg_rushing_touchdowns = recalculateMean(cumulativeStat.avg_rushing_touchdowns, newStat.rushing_touchdowns, newStat.game_num);
    },
    avg_passer_rating: (cumulativeStat, newStat) => {
        cumulativeStat.avg_passer_rating = recalculateMean(cumulativeStat.avg_passer_rating, newStat.passer_rating, newStat.game_num);
    },
    avg_tackles: (cumulativeStat, newStat) => {
        cumulativeStat.avg_tackles = recalculateMean(cumulativeStat.avg_tackles, newStat.tackles, newStat.game_num);
    },
    avg_sacks: (cumulativeStat, newStat) => {
        cumulativeStat.avg_sacks = recalculateMean(cumulativeStat.avg_sacks, newStat.sacks, newStat.game_num);
    },
    avg_tackles_for_loss: (cumulativeStat, newStat) => {
        cumulativeStat.avg_tackles_for_loss = recalculateMean(cumulativeStat.avg_tackles_for_loss, newStat.tackles_for_loss, newStat.game_num);
    },
    avg_passes_defended: (cumulativeStat, newStat) => {
        cumulativeStat.avg_passes_defended = recalculateMean(cumulativeStat.avg_passes_defended, newStat.passes_defended, newStat.game_num);
    },
    avg_defensive_interceptions: (cumulativeStat, newStat) => {
        cumulativeStat.avg_defensive_interceptions = recalculateMean(cumulativeStat.avg_defensive_interceptions, newStat.defensive_interceptions, newStat.game_num);
    },
    avg_defensive_touchdowns: (cumulativeStat, newStat) => {
        cumulativeStat.avg_defensive_touchdowns = recalculateMean(cumulativeStat.avg_defensive_touchdowns, newStat.defensive_touchdowns, newStat.game_num);
    },
    yards_per_kick_return: (cumulativeStat, newStat) => {
        cumulativeStat.yards_per_kick_return = (cumulativeStat.totals.kick_returns !== 0) ? cumulativeStat.totals.kick_return_yards / cumulativeStat.totals.kick_returns : 0;
    },
    yards_per_punt_return: (cumulativeStat, newStat) => {
        cumulativeStat.yards_per_punt_return = (cumulativeStat.totals.punt_returns !== 0) ? cumulativeStat.totals.punt_return_yards / cumulativeStat.totals.punt_returns : 0;
    },
    field_goal_pct: (cumulativeStat, newStat) => {
        cumulativeStat.field_goal_pct = recalculatePct(cumulativeStat.totals.field_goals_made, cumulativeStat.totals.field_goals_attempted);
    },
    avg_field_goal_attempts: (cumulativeStat, newStat) => {
        cumulativeStat.avg_field_goal_attempts = recalculateMean(cumulativeStat.avg_field_goal_attempts, newStat.field_goals_attempted, newStat.game_num);
    },
    avg_punts: (cumulativeStat, newStat) => {
        cumulativeStat.avg_punts = recalculateMean(cumulativeStat.avg_punts, newStat.punts, newStat.game_num);
    },
    yards_per_punt: (cumulativeStat, newStat) => {
        cumulativeStat.yards_per_punt = (cumulativeStat.totals.punts !== 0) ? cumulativeStat.totals.punt_yards / cumulativeStat.totals.punts : 0;
    }
}

const recalculatePct = (successes: number, attempts: number) => {
    return (attempts !== 0) ? successes / attempts : 0;
}

const recalculateMean = (cumulativeStat: number, newStat: number, sampleSize: number) => {
    const result = ((cumulativeStat * (sampleSize - 1)) + newStat) / sampleSize;
    if (isNaN(result)) {
        console.log("cumulativeStat: ", cumulativeStat, "newStat: ", newStat, "sampleSize: ", sampleSize);
        throw new Error("Mean is NaN")
    }
    return result;
}

const setTotals = (cumulativeStats: SeasonTotals, newStats: BoxscoreEventJoin) => {
    for (let prop in cumulativeStats) {
        if (cumulativeStats.hasOwnProperty(prop) && newStats.hasOwnProperty(prop)) {
            cumulativeStats[prop] += newStats[prop];
        }
    }

    // console.log(`Totals for game: ${newStats.game_num} of season: `, cumulativeStats);
}

/**
 * returns SeasonStats with all fields initialized to 0
 */
const getInitializedSeasonStats = (): SeasonStats => {
    return  {
        event_id: 0,
        team_id: 0,
        avg_first_downs: 0,
        avg_first_downs_passing: 0,
        avg_first_downs_rushing: 0,
        avg_first_downs_penalty: 0,
        third_down_conversion_pct: 0,
        fourth_down_conversion_pct: 0,
        avg_offensive_plays: 0,
        avg_offensive_yards: 0,
        avg_drives: 0,
        completion_pct: 0,
        avg_interceptions: 0,
        avg_sacks_against: 0,
        avg_yards_lost_sacks: 0,
        avg_rushing_yards: 0,
        avg_rushing_attempts: 0,
        redzone_conversion_pct: 0,
        avg_penalties: 0,
        avg_penalty_yards: 0,
        avg_turnovers: 0,
        avg_fumbles_lost: 0,
        avg_passing_touchdowns: 0,
        avg_rushing_touchdowns: 0,
        avg_passer_rating: 0,
        avg_tackles: 0,
        avg_sacks: 0,
        avg_tackles_for_loss: 0,
        avg_passes_defended: 0,
        avg_defensive_interceptions: 0,
        avg_defensive_touchdowns: 0,
        yards_per_kick_return: 0,
        yards_per_punt_return: 0,
        field_goal_pct: 0,
        avg_field_goal_attempts: 0,
        avg_punts: 0,
        yards_per_punt: 0,
        totals: {
            third_down_attempts: 0,
            third_down_conversions: 0,
            fourth_down_attempts: 0,
            fourth_down_conversions: 0,
            completions: 0,
            completion_attempts: 0,
            rushing_attempts: 0,
            red_zone_conversions: 0,
            red_zone_attempts: 0,
            kick_return_yards: 0,
            kick_returns: 0,
            punt_return_yards: 0,
            punt_returns: 0,
            field_goals_made: 0,
            field_goals_attempted: 0,
            punts: 0,
            punt_yards: 0
        }
    }
}

