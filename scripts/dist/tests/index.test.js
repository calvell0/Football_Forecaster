import { DataService } from "../services/DataService.js";
import { MockDataClient } from "./MockDataClient.js";
const dataService = DataService.build(new MockDataClient());
// test("Team data populated", (t, done) => {
//     const teams = dataService.getTeams();
//     assert(teams.length > 0);
//     done();
// })
