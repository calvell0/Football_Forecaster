// Import required modules
import mysql from 'mysql2';

// Establish a connection to sql use these param when creating your server
const host = mysql.createConnection({
host: 'localhost',
user: 'root',
password: '0000',
port: 3306
});

// Connect to sql
host.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + host.threadId);

    // Create the database if it doesn't already exist
    host.query('CREATE DATABASE IF NOT EXISTS nfl_data', (err, results) => {
        if (err) throw err;
        console.log('Database created or already exists.');

        // Now connect to the newly created or existing database
        host.changeUser({ database: 'nfl_data' }, (err) => {
            if (err) throw err;
            console.log('Using nfl_data database.');

            // Create the `teams` table
            host.query(`
                CREATE TABLE IF NOT EXISTS teams (
                    id VARCHAR(255) PRIMARY KEY,
                    uid VARCHAR(255),
                    slug VARCHAR(255),
                    abbreviation VARCHAR(10),
                    displayName VARCHAR(255),
                    shortDisplayName VARCHAR(100),
                    color VARCHAR(10),
                    alternateColor VARCHAR(10),
                    isActive BOOLEAN,
                    isAllStar BOOLEAN
)
`, (err) => {
if (err) throw err;
                console.log('Teams table created or already exists.');
            });

            // Create the `nfl_events` table
            host.query(`
                CREATE TABLE IF NOT EXISTS nfl_events (
                    id VARCHAR(255) PRIMARY KEY,
                    uid VARCHAR(255),
                    date DATETIME,
                    shortName VARCHAR(100),
                    season_year INT,
                    season_type INT CHECK (season_type IN (1, 2, 3, 4)),
                    competitions JSON
)
`, (err) => {
if (err) throw err;
                console.log('NFL Events table created or already exists.');
            });

            // Create the `competitions` table
            host.query(`
                CREATE TABLE IF NOT EXISTS competitions (
                    id VARCHAR(255) PRIMARY KEY,
                    uid VARCHAR(255),
                    date DATETIME,
                    competitionType VARCHAR(50),
                    timeValid BOOLEAN,
                    neutralSite BOOLEAN,
                    conferenceCompetition BOOLEAN,
                    venue_id VARCHAR(255),
                    competitors JSON
                )
`, (err) => {
if (err) throw err;
                console.log('Competitions table created or already exists.');
            });

            // Create the `venues` table
            host.query(`
                CREATE TABLE IF NOT EXISTS venues (
                    id VARCHAR(255) PRIMARY KEY
)
`, (err) => {
if (err) throw err;
                console.log('Venues table created or already exists.');
            });

            // Create the `records` table
            host.query(`
                CREATE TABLE IF NOT EXISTS records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    team_id VARCHAR(255), -- Foreign key to \`teams\`
                    type ENUM('home', 'away', 'total'),
                    summary VARCHAR(255)
                )
`, (err) => {
if (err) throw err;
                console.log('Records table created or already exists.');
            });

            // Close the connection once done
            host.end(err => {
                if (err) {
                    console.error('Error closing the connection:', err);
                } else {
                    console.log('Connection closed.');
                }
            });
        });
    });
});
