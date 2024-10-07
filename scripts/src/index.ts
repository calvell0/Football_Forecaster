import {DataService} from "./services/DataService.js";
import {HttpDataClient} from "./HTTPDataClient.js";
import {init} from "./db/init.js";


await init();

const dataService = await DataService.build(new HttpDataClient());
console.log("Saving teams to db...");
await dataService.persistTeams();





