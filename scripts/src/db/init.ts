// Import required modules
import mysql, {Connection} from 'mysql2/promise';
import dotenv from 'dotenv';

//load .env variables into process.env
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

export const init = async () => {
    const host = await connect();

    await host.query(`
        DROP DATABASE IF EXISTS nfl_data
        `);

    // Create the database if it doesn't already exist
    await host.query(`
        CREATE DATABASE IF NOT EXISTS nfl_data
        `);

    // Now connect to the newly created or existing database
    await host.changeUser({database: 'nfl_data'});

    await host.query(`
        CREATE TABLE IF NOT EXISTS Team
        (
            id               VARCHAR(5) UNIQUE PRIMARY KEY NOT NULL,
            uid              VARCHAR(15),
            abbreviation     VARCHAR(5),
            displayName      VARCHAR(60),
            shortDisplayName VARCHAR(30),
            color            VARCHAR(6),
            alternateColor   VARCHAR(6),
            isActive         BIT,
            isAllStar        BIT
        );
    `);


    await host.query(`
        CREATE TABLE IF NOT EXISTS NFL_Event
        (
            id                     VARCHAR(20) PRIMARY KEY,
            uid                    VARCHAR(60),
            date                   DATETIME,
            short_name             VARCHAR(20),
            season_year            SMALLINT,
            competition_type       SMALLINT,
            conference_competition BIT,
            neutral_site           BIT,
            venue                  SMALLINT,
            home_team              INT,
            away_team              INT,
            venue_id               INT
        );
    `);

    await host.query(`
        CREATE TABLE IF NOT EXISTS Competitor
        (
            instance_id  INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
            team_id      varchar(5)                     NOT NULL,
            event_id     varchar(20)                    NOT NULL,
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
        ALTER TABLE NFL_Event
            ADD CONSTRAINT FOREIGN KEY (home_team) REFERENCES Competitor (instance_id)
    `);

    await host.query(`
        ALTER TABLE NFL_Event
            ADD CONSTRAINT FOREIGN KEY (away_team) REFERENCES Competitor (instance_id)
    `)

    await host.end(err => {
        if (err) {
            console.error('Error closing the connection:', err);
        } else {
            console.log('Connection closed.');
        }
    });


}

