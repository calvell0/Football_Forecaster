import axios from "axios";
export class HttpDataClient {
    API_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/";
    constructor() {
    }
    async getAllEvents() {
        const events = [];
        const scoreboardURL = "scoreboard?dates=20200101-20201231&limit=1000";
        const response = await axios.get(this.API_BASE_URL + scoreboardURL)
            .catch((error) => {
            console.error("[ERROR] Request failed. Check your network or ensure that you're not rate-limited.");
        });
        // console.log(response.data);
        return response.data.events;
    }
    async getAllTeams() {
        const teams = [];
        const response = await axios.get(this.API_BASE_URL + "teams")
            .catch((error) => {
            console.error("[ERROR] Request failed. Check your network or ensure that you're not rate-limited.");
        });
        // console.log(response.data.sports[0].leagues[0].teams);
        response.data.sports[0].leagues[0].teams.forEach((team) => {
            teams.push(team.team);
        });
        // console.log(teams);
        return teams;
    }
}
