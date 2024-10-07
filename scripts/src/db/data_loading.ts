import mysql, {Connection} from 'mysql2/promise';
import {connect} from './init.js';
import {NFLEvent, Team} from "../models/models.js";
import {parseRecords} from "../utils/dataUtils.js";

export const persist_teams = async (teams: Team[]) => {
    const host = await connect();
    console.log(teams);
    await host.query(`INSERT INTO Team
                      (id, uid, abbreviation, displayName, shortDisplayName, color, alternateColor, isActive,
                       isAllStar)
                      VALUES ?`,
        [
            teams.map(team =>
                [
                    team.id, team.uid, team.abbreviation, team.displayName,
                    team.shortDisplayName, team.color, team.alternateColor, team.isActive, team.isAllStar
                ]
            )
        ]
    );


    await host.end();
}

// const persist_events = async (events: NFLEvent[]) => {
//     const host = await connect();
//
//     const populateEventsQuery = mysql.format(`INSERT INTO NFL_Event
//                                 (id, uid, date, short_name, season_year,
//                                  competition_type, conference_competition,
//                                  neutral_site, venue, home_team, away_team)
//                                 VALUES ?`,
//         [ //mysql accepts batch inserts as a double-nested array
//             events.map(event =>
//                 [
//                     event.id, event.uid, event.date, event.shortName, event.season.year, event.competitions[0].competitionType,
//                     event.competitions[0].conferenceCompetition, event.competitions[0].neutralSite, event.competitions[0].venue.id,
//                     null, null //these will be updated in the next step
//                 ]
//             )
//         ]
//     );
//
//     await host.query(populateEventsQuery);
//
//     const populateCompetitorsQuery = mysql.format(`
//         INSERT INTO Competitor (team_id, event_id, home_wins, home_losses, away_wins, away_losses, total_wins,
//                                 total_losses) VALUES ?`,
//         [ //mysql accepts batch inserts as a double-nested array
//             events.map(event => {
//
//                     const records = parseRecords();
//                     return [
//                         event.competitions[0].competitors[0].team.id, event.id, 0, 0, 0, 0, 0, 0
//                     ]
//                 }
//             )
//         ]
//
//     );
//     await host.end();
// }

