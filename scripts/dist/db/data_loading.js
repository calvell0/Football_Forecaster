import { connect } from './initialize_database.js';
import { parseRecords } from "../utils/dataUtils.js";
export const persist_teams = async (teams) => {
    const host = await connect();
    await host.query(`INSERT INTO Team
                      (id, uid, abbreviation, display_name, short_display_name, color, alternate_color, is_active,
                       is_all_star)
                      VALUES ?`, [
        teams.map(team => [
            team.id, team.uid, team.abbreviation, team.displayName,
            team.shortDisplayName, team.color, team.alternateColor, team.isActive, team.isAllStar
        ])
    ]);
    await host.query(`
        INSERT INTO Logo (team_id, href) VALUES ?`, [
        teams.map(team => team.logos.map((href) => [team.id, href])).flat(1)
    ]);
    await host.end();
};
export const persist_events = async (events) => {
    const host = await connect();
    await host.query(`INSERT INTO NFL_Event
                                (id, uid, date, short_name, season_year,
                                 competition_type, conference_competition,
                                 neutral_site, status, home_team, away_team)
                                VALUES ?`, [
        events.map(event => [
            event.id, event.uid, event.date, event.shortName, event.season.year, event.competitions[0].type,
            event.competitions[0].conferenceCompetition, event.competitions[0].neutralSite, event.status,
            event.competitions[0].competitors[0].team.id, event.competitions[0].competitors[1].team.id
        ])
    ]);
    /*
        Insert competitors into competitor table:
        Create a new array of Competitor objects from event array, since there are
        2 Competitors per event.
        Then, batch insert Competitors into Competitor table.
     */
    let competitors = [];
    events.forEach(event => {
        event.competitions[0].competitors.forEach(competitor => {
            competitor.event_id = event.id;
            competitors.push(competitor);
        });
    });
    await host.query(`
        INSERT INTO Competitor (team_id, event_id, winner, home_wins, home_losses, away_wins, away_losses) VALUES ?`, [
        competitors.map(competitor => {
            const [hWins, hLosses, aWins, aLosses, ...rest] = parseRecords(competitor.records);
            return [
                competitor.team.id, competitor.event_id, competitor.winner, hWins, hLosses, aWins, aLosses
            ];
        })
    ]);
    await host.end();
};
