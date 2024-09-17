import {Game} from "./models/Game";
import {Team} from "./models/Team";
import {DataService} from "./models/dataService";


export class HTTPDataService implements DataService {

    readonly API_BASE_URL: string = "https://site.api.espn.com/apis/site/v2/sports/football/college-football/";

    getAllGames(): Game[] {
        throw new Error("Method not implemented.");
    }

    getTeams(): Team[] {
        let teams: Team[1000];
        axios.get(this.API_BASE_URL + "teams?limit=1000")
            .then(response => {
                const teamsArr = response.data.sports[0].leagues[0].teams;
                for (const team: Team of teamsArr){
                    teams.push(team);
                }
            });return teams;

    }


}