import {NFLEvent, Team, TeamResponseObject} from "./models/models.js";
import {DataClient} from "./models/DataClient.js";
import axios, {AxiosResponse} from "axios";


export class HttpDataClient implements DataClient {

    readonly API_BASE_URL: string = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/";



    constructor(){

    }

    async getAllEvents(): Promise<any> {
        const events: NFLEvent[] = [];
        const scoreboardURL = "scoreboard?dates=20200101-20201231&limit=1000";
        const response = await axios.get(this.API_BASE_URL + scoreboardURL)
            .catch((error: any) => {
                console.error(error);
            }) as AxiosResponse;
        // console.log(response.data);

       return response.data.events;
    }

    async getAllTeams(): Promise<any> {
        const teams= [];
        const response = await axios.get(this.API_BASE_URL + "teams")
            .catch((error: any) => {
                console.error(error);
            }) as AxiosResponse;
        // console.log(response.data.sports[0].leagues[0].teams);

        response.data.sports[0].leagues[0].teams.forEach((team) => {
            teams.push(team.team);
        });
        // console.log(teams);
        return teams;

    }


}