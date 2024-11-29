import {DataService} from "./services/DataService.js";
import {HttpDataClient} from "./HTTPDataClient.js";
import {initialize_database} from "./db/initialize_database.js";
import dotenv from 'dotenv';
import {calculateSeasonStats} from "./services/SeasonStatService.js";
import {export_training_data, persist_seasonstats} from "./db/data_loading.js";
import path from 'path';
import { fileURLToPath } from 'url';

//get current directory so that we can have mysql save data to our project directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

//load .env variables into process.env
dotenv.config({
    path: '../.env'
});

const args: string[] = process.argv.slice(2);
console.info("Args: ", args);

let preserveDB = false;
if (args.includes("--preserve-db")){ //if --preserve-db is passed, don't drop and recreate the database
    preserveDB = true;
}
if (args.includes("--export")){
    const output_path = path.resolve(__dirname, "../../model/training_data/training_data.csv");
    console.log(`Exporting training data to ${output_path}...`);
    await export_training_data(output_path);
    console.log("Export complete");
    process.exit(0);
}



await initialize_database(preserveDB);

const dataService = await DataService.build(new HttpDataClient());

if (!preserveDB){
    console.log("Saving teams to db...");
    await dataService.persistTeams();
    await dataService.persistEvents();
    console.log("Persist events completed, fetching box scores...");
    await dataService.fetchBoxScores();
    await dataService.persistBoxScores();
}

const seasonStats = await calculateSeasonStats();
await persist_seasonstats(seasonStats);






