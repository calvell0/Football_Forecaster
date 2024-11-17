import {NFLEvent, Team, TeamResponseObject} from "./models/models.js";
import {DataClient} from "./models/DataClient.js";
import axios, {AxiosResponse} from "axios";
import {sleep} from "./utils/generalUtils.js";


export class HttpDataClient implements DataClient {

    readonly API_BASE_URL: string = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/";


    constructor() {

    }

    async getAllEvents(year: string): Promise<any> {
        const events: NFLEvent[] = [];
        const scoreboardURL = `scoreboard?dates=${year}&limit=1000`;
        const response = await axios.get(this.API_BASE_URL + scoreboardURL)
            .catch((error: any) => {
                throw new Error(error);
            }) as AxiosResponse;
        // console.log(response.data);

        if (response.status !== 200 || !response.data) throw new Error(`Request failed. Status:${response.status}, data:${response.data}`);
        return response.data.events;
    }

    async getAllTeams(): Promise<any> {
        const teams = [];
        const response = await axios.get(this.API_BASE_URL + "teams")
            .catch((error: any) => {
                console.error("[ERROR] Request failed. Check your network or ensure that you're not rate-limited.");
            }) as AxiosResponse;
        // console.log(response.data.sports[0].leagues[0].teams);

        response.data.sports[0].leagues[0].teams.forEach((team) => {
            teams.push(team.team);
        });
        // console.log(teams);
        return teams;

    }

    async getAllBoxScores(eventIds: number[]): Promise<Array<any>> {

        //TODO: REMOVE THIS; For testing purposes only
        eventIds = eventIds.slice(0, 200);

        const BATCH_SIZE = 50;
        let batchNumber = 0;
        let boxscoreIdx = 0;
        const boxScores = new Array(eventIds.length);
        const promises = new Array(eventIds.length);

        for (let i = 0; i < eventIds.length; i += BATCH_SIZE) {
            const batchedEventIds = eventIds.slice(i, Math.min(i + BATCH_SIZE, eventIds.length));
            for (let event of batchedEventIds) {
                promises[boxscoreIdx] = this.fetchBoxScore(event, boxscoreIdx);
                boxscoreIdx++;
            }
            console.info(`Batch ${batchNumber++} of ${Math.ceil(eventIds.length / BATCH_SIZE)} fetched.`);
            await sleep(1250); //allow time between batches for server to fulfill requests
            if (batchNumber % 5 === 0) {
                await sleep(3000); //after 5 batches wait even longer
            }
        }

        await Promise.all(promises).then((responses) => {
            for (let i = 0; i < responses.length; i++) {
                responses[i].data.gamepackageJSON.boxscore.eventId = responses[i].data.gameId;
                boxScores[i] = responses[i].data.gamepackageJSON.boxscore;
            }
        });

        return boxScores;
    }

    private async fetchBoxScore(eventId: number, index: number, retries: number = 3): Promise<AxiosResponse> {
        try {
            return await axios.get(`https://cdn.espn.com/core/nfl/boxscore?xhr=1&gameId=${eventId}`);
        } catch (error: any) {
            if (retries > 0) {
                console.warn(`Retrying... (${3 - retries + 1})`);
                return this.fetchBoxScore(eventId, index, retries - 1);
            } else {
                console.error(`Error: at index: ${index}`);
                throw new Error(error);
            }
        }
    }


}