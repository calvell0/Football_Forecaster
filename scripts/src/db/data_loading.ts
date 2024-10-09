
import {connect} from './initialize_database.js';
import {NFLEvent, Team} from "../models/models.js";


export const persist_teams = async (teams: Team[]) => {
    const host = await connect();
    console.log(teams);
    await host.query(`INSERT INTO Team
                      (id, uid, abbreviation, display_name, short_display_name, color, alternate_color, is_active,
                       is_all_star)
                      VALUES ?`,
        [ //mysql2 accepts batch inserts as a double-nested array
            teams.map(team =>
                [
                    parseInt(team.id), team.uid, team.abbreviation, team.displayName,
                    team.shortDisplayName, team.color, team.alternateColor, team.isActive, team.isAllStar
                ]
            )
        ]
    );

    await host.query(`
        INSERT INTO Logo (team_id, href) VALUES ?`,
            [ //mysql2 accepts batch inserts as a double-nested array
            teams.map(team =>
                team.logos.map((href: string) => [parseInt(team.id), href])
            ).flat(1)
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

