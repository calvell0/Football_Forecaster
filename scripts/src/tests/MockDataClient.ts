import {DataClient} from "../models/DataClient.js";
import boxscore from "./test_data/boxscore.json" assert {type: "json"};
import events from "./test_data/events.json" assert {type: "json"};
import teams from "./test_data/teams.json" assert {type: "json"};

const testDataDir = "file://scripts/src/tests/test_data";

export class MockDataClient implements DataClient {


    async getPastEvents(yearsBack: number): Promise<any> {


        // console.log(teams);
        console.log("[MOCKDATACLIENT] Events.length: ", events.events.length);
        return events.events;
    }

    async getAllTeams(): Promise<any> {
        const newTeamArr = [];
        teams.sports[0].leagues[0].teams.forEach((team) => {
            newTeamArr.push(team.team);
        });

        return newTeamArr;
    }

    async getAllBoxScores(eventIds: number[]): Promise<Array<any>> {


            // @ts-ignore
        boxscore.gamepackageJSON.boxscore.eventId = boxscore.gameId;
            const newBoxScore = [boxscore.gamepackageJSON.boxscore];

        return newBoxScore;
    }


}