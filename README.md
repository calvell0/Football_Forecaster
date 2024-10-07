# Football Forecaster

#### Project Team 4

### Overview

Football forecaster is a web application that predicts the outcome of football matches based on historical data. The application uses a machine learning model to predict the outcome of football matches. The model is trained on historical NFL data from ESPN's API.

### Setup + Running

1. Clone this repository
2. Install node dependencies by running `npm install` in the `./scripts` directory
3. Ensure that you have MySQL Server 8.0 installed and running on your machine
4. Create a `.env` file in the root directory of the project. This file should contain your MySQL configuration details. Here's a template you can use:

```env
MYSQL_USER=<your_mysql_username>
MYSQL_PASSWORD=<your_mysql_password>
MYSQL_HOST=localhost
MYSQL_PORT=3306
```
5. Open a terminal in the `./scripts` directory and run `npm run exec` to compile the TypeScript files, run the
script to initialize the database, and populate it with data from ESPN



### Progress

So far, we have completed a script that pulls historical game data and team data from ESPN, along with a basic project structure and some basic HTML/CSS UI work. Our next steps are to lay out the database design with an ERD and turn that structure into a database intitialization script. Along with that, we will begin work to give the Spring Boot webserver basic functionality, and begin the process of deciding which machine learning architecture we should use. 
