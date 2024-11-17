
import {connect} from './initialize_database.js';
import {BoxScore, Competitor, NFLEvent, Team} from "../models/models.js";
import mysql from 'mysql2';
import {parseRecords} from "../utils/dataUtils.js";


export const persist_teams = async (teams: Team[]) => {
    const host = await connect();
    await host.query(`INSERT INTO Team
                      (id, uid, abbreviation, display_name, short_display_name, color, alternate_color, is_active,
                       is_all_star)
                      VALUES ?`,
        [ //mysql2 accepts batch inserts as a double-nested array
            teams.map(team =>
                [
                    team.id, team.uid, team.abbreviation, team.displayName,
                    team.shortDisplayName, team.color, team.alternateColor, team.isActive, team.isAllStar
                ]
            )
        ]
    );

    await host.query(`
        INSERT INTO Logo (team_id, href) VALUES ?`,
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
                                (id, uid, date, short_name, season_year,
                                 competition_type, conference_competition,
                                 neutral_site, status, home_team, away_team)
                                VALUES ?`,
            [ //mysql accepts batch inserts as a double-nested array
                events.map(event =>
                    [
                        event.id, event.uid, event.date, event.shortName, event.season.year, event.competitions[0].type,
                        event.competitions[0].conferenceCompetition, event.competitions[0].neutralSite, event.status,
                        event.competitions[0].competitors[0].team.id, event.competitions[0].competitors[1].team.id
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

        let competitors: Competitor[] = [];

        events.forEach(event => {
            event.competitions[0].competitors.forEach(competitor => {
                competitor.event_id = event.id;
                competitors.push(competitor);
            });

        });

        await host.query(`
        INSERT INTO Competitor (team_id, event_id, winner, home_wins, home_losses, away_wins, away_losses) VALUES ?`,
            [ //mysql accepts batch inserts as a double-nested array
                competitors.map(competitor => {

                        const [hWins, hLosses, aWins, aLosses, ...rest] = parseRecords(competitor.records);
                        return [
                            competitor.team.id, competitor.event_id, competitor.winner, hWins, hLosses, aWins, aLosses
                        ]
                    }
                )
            ]
        );
    }
    console.info(`[INFO] ${eventsList.length} events inserted in ${iterCount} batches.`);

    await host.end();
}

export const persist_boxscores = async (boxscores: BoxScore[]) => {
//TODO: this

}

