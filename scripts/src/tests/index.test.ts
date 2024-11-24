import {DataService} from "../services/DataService.js";
import {MockDataClient} from "./MockDataClient.js";
import {HttpDataClient} from "../HTTPDataClient.js";
import {getBoxScores, persist_seasonstats} from "../db/data_loading.js";
import {calculateSeasonStats} from "../services/SeasonStatService.js";
import {initialize_database} from "../db/initialize_database.js";

const args: string[] = process.argv.slice(2);
console.info("Args: ", args);

let preserveDB = false;
if (args.includes("--preserve-db")){ //if --preserve-db is passed, don't drop and recreate the database
    preserveDB = true;
}

await initialize_database(preserveDB);
const dataService = await DataService.build(new MockDataClient(), preserveDB);

if (!preserveDB){
    console.log("Saving teams to db...");
    await dataService.persistTeams();
    console.log("Saving events to db...");
    await dataService.persistEvents();
    console.log("Fetching box scores...");
    await dataService.fetchBoxScores();
    await dataService.persistBoxScores();
}
// test("Team data populated", (t, done) => {
//     const teams = dataService.getTeams();
//     assert(teams.length > 0);
//     done();
// })


const seasonStats = await calculateSeasonStats();
await persist_seasonstats(seasonStats);