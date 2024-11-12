import { DataService } from "./services/DataService.js";
import { HttpDataClient } from "./HTTPDataClient.js";
import { initialize_database } from "./db/initialize_database.js";
import dotenv from 'dotenv';
//load .env variables into process.env
dotenv.config({
    path: '../.env'
});
await initialize_database();
const dataService = await DataService.build(new HttpDataClient());
console.log("Saving teams to db...");
await dataService.persistTeams();
await dataService.persistEvents();
