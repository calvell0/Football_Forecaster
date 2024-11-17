import {DataService} from "../services/DataService.js";
import {MockDataClient} from "./MockDataClient.js";
import assert from "node:assert";
import test from "node:test";
import {HttpDataClient} from "../HTTPDataClient.js";


const dataService = await DataService.build(new MockDataClient());
await dataService.fetchBoxScores();
console.log(dataService.getBoxScores());

// test("Team data populated", (t, done) => {
//     const teams = dataService.getTeams();
//     assert(teams.length > 0);
//     done();
// })
