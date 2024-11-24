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



    await host.end(err => {
        if (err) {
            console.error('Error closing the connection:', err);
        } else {
            console.log('Connection closed.');
        }
    });


}

