# Football Forecaster

#### Project Team 4

### Overview

Football forecaster is a web application that predicts the outcome of football matches based on historical data. The application uses a machine learning model to predict the outcome of football matches. The model is trained on historical NFL data from ESPN's API.

### Setup + Running

1. Clone this repository
2. Install node dependencies by running `npm install` in the `./scripts` directory
3. Ensure that you have [MySQL Server 8.0](https://dev.mysql.com/downloads/mysql/8.0.html) installed and running on your machine
4. Create a file titled `.env` in the root directory of the project. This file should contain your MySQL configuration details. Here's a template you can use:

```env
MYSQL_USER=<your_mysql_username>
MYSQL_PASSWORD=<your_mysql_password>
MYSQL_HOST=localhost
MYSQL_PORT=3306
```
5. Open a terminal in the `./scripts` directory and run `npm run compile_and_run` to compile the TypeScript files, run the
script to initialize the database, and populate it with data from ESPN
6. Navigate back to the root directory of the project
7. Ensure that you have Java installed. Verify this by running `java -version` in your terminal.
7. Resolve all dependencies for the Spring Boot application by running `./mvnw clean install`
8. Run the resulting compiled Java application with `java -jar target/football-forecaster-0.0.1-SNAPSHOT.jar`
9. Use the web application by navigating to http://localhost:8080 in your browser



