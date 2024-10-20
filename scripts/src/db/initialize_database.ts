// Import required modules
import mysql, {Connection} from 'mysql2/promise';

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

export const initialize_database = async (): Promise<void> => {
    const host = await connect();

    await host.query(`
        DROP DATABASE IF EXISTS nfl_data
        `);


    await host.query(`
        CREATE DATABASE IF NOT EXISTS nfl_data
        `);

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



    await host.end(err => {
        if (err) {
            console.error('Error closing the connection:', err);
        } else {
            console.log('Connection closed.');
        }
    });


}

