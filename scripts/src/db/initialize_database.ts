// Import required modules
import mysql, {Connection} from 'mysql2/promise';
import dotenv from "dotenv";


dotenv.config({
    path: '../.env'
});

export const connect = async (): Promise<Connection> => {
    const {MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD} = process.env;
    const MYSQL_PORT = parseInt(process.env.MYSQL_PORT);


    const host = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        port: MYSQL_PORT,
        database: "nfl_data"
    });

    await host.connect().catch(err => {
        console.error("Error connecting to MySQL: " + err.stack)
    });
    console.log('Connected to MySQL DB as id ' + host.threadId);

    return host;
}

export const initialize_database = async (preserveDB: boolean = false): Promise<void> => {
    const host = await connect();

    //drop and recreate the database if --preserve-db is not passed
    if (!preserveDB) {
        console.log("Dropping and recreating database...");
        await host.query(`
        DROP DATABASE IF EXISTS nfl_data
        `);


        await host.query(`
        CREATE DATABASE IF NOT EXISTS nfl_data
        `);
    }

    // Now connect to the newly created or existing database
    await host.changeUser({database: 'nfl_data'});

    await host.query(`
        CREATE TABLE IF NOT EXISTS Team
        (
            id               SMALLINT UNIQUE PRIMARY KEY NOT NULL,
            uid              VARCHAR(17),
            abbreviation     VARCHAR(5),
            display_name      VARCHAR(50),
            short_display_name VARCHAR(30),
            color            VARCHAR(6),
            alternate_color   VARCHAR(6),
            is_active         BIT,
            is_all_star        BIT
        );
    `);


    await host.query(`
        CREATE TABLE IF NOT EXISTS NFL_Event
        (
            id                     INT UNSIGNED PRIMARY KEY NOT NULL,
            uid                    VARCHAR(26),
            date                   DATETIME,
            short_name             VARCHAR(20),
            season_year            SMALLINT,
            week                   SMALLINT,
            competition_type       SMALLINT,
            conference_competition BIT,
            neutral_site           BIT,
            home_team              SMALLINT,
            away_team              SMALLINT,
            status                 ENUM('STATUS_SCHEDULED', 'STATUS_OTHER', 'STATUS_FINAL'),
            FOREIGN KEY (home_team) REFERENCES Team (id),
            FOREIGN KEY (away_team) REFERENCES Team (id)
        );
    `);

    await host.query(`
        CREATE TABLE IF NOT EXISTS Competitor
        (
            instance_id  INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
            team_id      SMALLINT                       NOT NULL,
            event_id     INT UNSIGNED                   NOT NULL,
            winner       BIT DEFAULT NULL,
            home_wins    SMALLINT DEFAULT 0,
            home_losses  SMALLINT DEFAULT 0,
            away_wins    SMALLINT DEFAULT 0,
            away_losses  SMALLINT DEFAULT 0,
            total_wins   SMALLINT AS (home_wins + away_wins),
            total_losses SMALLINT AS (home_losses + away_losses),
            FOREIGN KEY (team_id) REFERENCES Team (id),
            FOREIGN KEY (event_id) REFERENCES NFL_Event (id)
        );
    `);

    await host.query(`
        CREATE TABLE IF NOT EXISTS Logo
        (
            id      INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
            href    VARCHAR(255),
            team_id SMALLINT,
            FOREIGN KEY (team_id) REFERENCES Team (id)
        )
    `);

    await host.query(`
        CREATE TABLE IF NOT EXISTS Boxscore 
        (
            event_id INT UNSIGNED NOT NULL,
            team_id SMALLINT NOT NULL,
            first_downs INT,
            first_downs_passing INT,
            first_downs_rushing INT,
            first_downs_penalty INT,
            third_down_conversions INT,
            third_down_attempts INT,
            fourth_down_conversions INT,
            fourth_down_attempts INT,
            total_offensive_plays INT,
            total_offensive_yards INT,
            total_drives INT,
            completions INT,
            completion_attempts INT,
            interceptions_thrown INT,
            sacks_against INT,
            yards_lost INT,
            rushing_yards INT,
            rushing_attempts INT,
            red_zone_attempts INT,
            red_zone_conversions INT,
            penalties INT,
            penalty_yards INT,
            turnovers INT,
            fumbles_lost INT,
            passing_touchdowns INT,
            rushing_touchdowns INT,
            passer_rating FLOAT,
            tackles INT,
            sacks INT,
            tackles_for_loss INT,
            passes_defended INT,
            defensive_interceptions INT,
            defensive_touchdowns INT,
            kick_returns INT,
            kick_return_yards INT,
            punt_returns INT,
            punt_return_yards INT,
            field_goals_made INT,
            field_goals_attempted INT,
            punts INT,
            punt_yards INT,
            CONSTRAINT PRIMARY KEY (event_id, team_id),
            FOREIGN KEY (event_id) REFERENCES nfl_event (id),
            FOREIGN KEY (team_id) REFERENCES team (id)
        )
    `);

    await host.query(`
        CREATE TABLE IF NOT EXISTS season_stats
        (
            event_id INT UNSIGNED NOT NULL,
            team_id SMALLINT NOT NULL,
            avg_first_downs FLOAT, 
            avg_first_downs_passing FLOAT,
            avg_first_downs_rushing FLOAT,
            avg_first_downs_penalty FLOAT,
            third_down_conversion_pct FLOAT,
            fourth_down_conversion_pct FLOAT,
            avg_offensive_plays FLOAT,
            avg_offensive_yards FLOAT,
            avg_drives FLOAT,
            completion_pct FLOAT,
            avg_interceptions FLOAT,
            avg_sacks_against FLOAT,
            avg_yards_lost_sacks FLOAT,
            avg_rushing_yards FLOAT,
            avg_rushing_attempts FLOAT,
            redzone_conversion_pct FLOAT,
            avg_penalties FLOAT,
            avg_penalty_yards FLOAT,
            avg_turnovers FLOAT,
            avg_fumbles_lost FLOAT,
            avg_passing_touchdowns FLOAT,
            avg_rushing_touchdowns FLOAT,
            avg_passer_rating FLOAT,
            avg_tackles FLOAT,
            avg_sacks FLOAT,
            avg_tackles_for_loss FLOAT,
            avg_passes_defended FLOAT,
            avg_defensive_interceptions FLOAT,
            avg_defensive_touchdowns FLOAT,
            yards_per_kick_return FLOAT,
            yards_per_punt_return FLOAT,
            field_goal_pct FLOAT,
            avg_field_goal_attempts FLOAT,
            avg_punts FLOAT,
            yards_per_punt FLOAT,
            CONSTRAINT PRIMARY KEY (event_id, team_id),
            FOREIGN KEY (event_id) REFERENCES nfl_event (id),
            FOREIGN KEY (team_id) REFERENCES team (id)
        )
    `);

    await host.query(`
        CREATE VIEW EventCompetitors AS
    SELECT
        e.id AS event_id,
        e.home_team AS home_team_id,
        e.away_team AS away_team_id,
        home_comp.winner AS home_winner,
        home_comp.home_wins AS home_home_wins,
        home_comp.home_losses AS home_home_losses,
        home_comp.away_wins AS home_away_wins,
        home_comp.away_losses AS home_away_losses,
        home_comp.total_wins AS home_total_wins,
        home_comp.total_losses AS home_total_losses,
        away_comp.home_wins AS away_home_wins,
        away_comp.home_losses AS away_home_losses,
        away_comp.away_wins AS away_away_wins,
        away_comp.away_losses AS away_away_losses,
        away_comp.total_wins AS away_total_wins,
        away_comp.total_losses AS away_total_losses
    FROM
        NFL_Event e
            JOIN
        Competitor home_comp ON e.id = home_comp.event_id AND e.home_team = home_comp.team_id
            JOIN
        Competitor away_comp ON e.id = away_comp.event_id AND e.away_team = away_comp.team_id;
    `);

    await host.query(`
        CREATE VIEW CompetitorEventStats AS
SELECT
    ec.event_id,
    ec.home_winner,
    ec.home_home_wins,
    ec.home_home_losses,
    ec.home_away_wins,
    ec.home_away_losses,
    ec.home_total_wins,
    ec.home_total_losses,
    ec.away_home_wins,
    ec.away_home_losses,
    ec.away_away_wins,
    ec.away_away_losses,
    ec.away_total_wins,
    ec.away_total_losses,
    home.avg_first_downs AS home_avg_first_downs,
    home.avg_first_downs_passing AS home_avg_first_downs_passing,
    home.avg_first_downs_rushing AS home_avg_first_downs_rushing,
    home.avg_first_downs_penalty AS home_avg_first_downs_penalty,
    home.third_down_conversion_pct AS home_third_down_conversion_pct,
    home.fourth_down_conversion_pct AS home_fourth_down_conversion_pct,
    home.avg_offensive_plays AS home_avg_offensive_plays,
    home.avg_offensive_yards AS home_avg_offensive_yards,
    home.avg_drives AS home_avg_drives,
    home.completion_pct AS home_completion_pct,
    home.avg_interceptions AS home_avg_interceptions,
    home.avg_sacks_against AS home_avg_sacks_against,
    home.avg_yards_lost_sacks AS home_avg_yards_lost_sacks,
    home.avg_rushing_yards AS home_avg_rushing_yards,
    home.avg_rushing_attempts AS home_avg_rushing_attempts,
    home.redzone_conversion_pct AS home_redzone_conversion_pct,
    home.avg_penalties AS home_avg_penalties,
    home.avg_penalty_yards AS home_avg_penalty_yards,
    home.avg_turnovers AS home_avg_turnovers,
    home.avg_fumbles_lost AS home_avg_fumbles_lost,
    home.avg_passing_touchdowns AS home_avg_passing_touchdowns,
    home.avg_rushing_touchdowns AS home_avg_rushing_touchdowns,
    home.avg_passer_rating AS home_avg_passer_rating,
    home.avg_tackles AS home_avg_tackles,
    home.avg_sacks AS home_avg_sacks,
    home.avg_tackles_for_loss AS home_avg_tackles_for_loss,
    home.avg_passes_defended AS home_avg_passes_defended,
    home.avg_defensive_interceptions AS home_avg_defensive_interceptions,
    home.avg_defensive_touchdowns AS home_avg_defensive_touchdowns,
    home.yards_per_kick_return AS home_yards_per_kick_return,
    home.yards_per_punt_return AS home_yards_per_punt_return,
    home.field_goal_pct AS home_field_goal_pct,
    home.avg_field_goal_attempts AS home_avg_field_goal_attempts,
    home.avg_punts AS home_avg_punts,
    home.yards_per_punt AS home_yards_per_punt,
    away.avg_first_downs AS away_avg_first_downs,
    away.avg_first_downs_passing AS away_avg_first_downs_passing,
    away.avg_first_downs_rushing AS away_avg_first_downs_rushing,
    away.avg_first_downs_penalty AS away_avg_first_downs_penalty,
    away.third_down_conversion_pct AS away_third_down_conversion_pct,
    away.fourth_down_conversion_pct AS away_fourth_down_conversion_pct,
    away.avg_offensive_plays AS away_avg_offensive_plays,
    away.avg_offensive_yards AS away_avg_offensive_yards,
    away.avg_drives AS away_avg_drives,
    away.completion_pct AS away_completion_pct,
    away.avg_interceptions AS away_avg_interceptions,
    away.avg_sacks_against AS away_avg_sacks_against,
    away.avg_yards_lost_sacks AS away_avg_yards_lost_sacks,
    away.avg_rushing_yards AS away_avg_rushing_yards,
    away.avg_rushing_attempts AS away_avg_rushing_attempts,
    away.redzone_conversion_pct AS away_redzone_conversion_pct,
    away.avg_penalties AS away_avg_penalties,
    away.avg_penalty_yards AS away_avg_penalty_yards,
    away.avg_turnovers AS away_avg_turnovers,
    away.avg_fumbles_lost AS away_avg_fumbles_lost,
    away.avg_passing_touchdowns AS away_avg_passing_touchdowns,
    away.avg_rushing_touchdowns AS away_avg_rushing_touchdowns,
    away.avg_passer_rating AS away_avg_passer_rating,
    away.avg_tackles AS away_avg_tackles,
    away.avg_sacks AS away_avg_sacks,
    away.avg_tackles_for_loss AS away_avg_tackles_for_loss,
    away.avg_passes_defended AS away_avg_passes_defended,
    away.avg_defensive_interceptions AS away_avg_defensive_interceptions,
    away.avg_defensive_touchdowns AS away_avg_defensive_touchdowns,
    away.yards_per_kick_return AS away_yards_per_kick_return,
    away.yards_per_punt_return AS away_yards_per_punt_return,
    away.field_goal_pct AS away_field_goal_pct,
    away.avg_field_goal_attempts AS away_avg_field_goal_attempts,
    away.avg_punts AS away_avg_punts,
    away.yards_per_punt AS away_yards_per_punt
FROM
    EventCompetitors ec
        JOIN
    season_stats home ON ec.event_id = home.event_id AND ec.home_team_id = home.team_id
        JOIN
    season_stats away ON ec.event_id = away.event_id AND ec.away_team_id = away.team_id;
    `)



    await host.end(err => {
        if (err) {
            console.error('Error closing the connection:', err);
        } else {
            console.log('Connection closed.');
        }
    });


}

