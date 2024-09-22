import {Game} from "./models/Game";
import {Team} from "./models/Team";
import {DataService} from "./models/dataService";
import {DataRepository} from "./models/DataRepository";
const axios = require("axios");


export class HTTPDataService implements DataService {

    readonly API_BASE_URL: string = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/";


    constructor(){

    }

    getAllGames(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getAllTeams(): Promise<void> {
        const teams: Team[1000] = [];
        const response = await axios.get(this.API_BASE_URL + "teams");
        return response.data.sports[0].leagues[0].teams.map((team) => {

            teams.push({
                id: team.id,
                uid: team.uid,
                slug: team.slug,
                abbreviation: team.abbreviation,
                displayName: team.displayName,
                shortDisplayName: team.shortDisplayName,
                color: team.color,
                alternateColor: team.alternateColor,
                isActive: team.isActive,
                isAllStar: team.isAllStar
            } as Team);
        });

    }


}