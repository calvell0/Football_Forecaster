import {DataService} from "../services/DataService";
import {MockDataClient} from "./MockDataClient";
import assert from "node:assert";
import test from "node:test";
import {HttpDataClient} from "../HTTPDataClient";


const dataService = new DataService(new HttpDataClient());

test("Team data populated", (t, done) => {
    const teams = dataService.getTeams();
    assert(teams.length > 0);
    done();
})
