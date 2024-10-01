import {DataClient} from "../models/DataClient";
import {Team, TeamResponseObject} from "../models/models";
import teamData from "./test_data/teams.json";
import eventData from "./test_data/events.json";


export class MockDataClient implements DataClient {
    async getAllEvents(): Promise<any> {
        return eventData.events;
    }

    async getAllTeams(): Promise<any> {
        const teams: Team[] =[];
        teamData.sports[0].leagues[0].teams.forEach((team) => {
            teams.push(team.team);
        });
        return teams;
    }

}