import {DelayLevel} from "./models/models.js";
import {DataClient} from "./models/DataClient.js";
import axios, {AxiosResponse} from "axios";
import {sleep} from "./utils/generalUtils.js";
import dotenv from "dotenv";

dotenv.config({
    path: '../.env'
});

const getDelayLevel = (): DelayLevel => {
    const delayLevel = parseInt(process.env.BOXSCORE_REQ_DELAY_LEVEL);
    if (delayLevel >= 0 && delayLevel <= 3 && Number.isInteger(delayLevel)) {
        return delayLevel as DelayLevel;
    }
    else {
        console.warn("[WARN] Invalid BOXSCORE_REQ_DELAY_LEVEL specified. Defaulting to 1.");
        return 1;
    }
}

const delayLevel: DelayLevel = getDelayLevel();

//delays between requests and batches of requests scale based on the delay level.
const delays = {
    AFTER_FAILED_REQUEST: (delayLevel + 1) * 10,
    BETWEEN_BATCHES: delayLevel * 750,
    BETWEEN_BATCH_CHUNKS: delayLevel * 1000,
    BETWEEN_REQUESTS: (delayLevel > 1) ? 10 * delayLevel : 3
}





export class HttpDataClient implements DataClient {

    readonly API_BASE_URL: string = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/";

    constructor() {

    }

    async getPastEvents(yearsBack: number): Promise<any> {
        const eventRequests: Promise<void>[] = []
        for (let year = 2023; year >= 2023 - yearsBack; year--) {
            eventRequests.push(this.getAllEvents(year.toString()));
            await sleep(25);
        }
        return await Promise.all(eventRequests).then((events) => events.flat());
    }

    private async getAllEvents(year: string): Promise<any> {
        const scoreboardURL = `scoreboard?dates=${year}&limit=1000`;
        const response = await this.reqDataWithRetries(this.API_BASE_URL + scoreboardURL, parseInt(year));
        console.log(`Request for year ${year} successful.`);

        if (response.status !== 200 || !response.data) throw new Error(`Request failed. Status:${response.status}, data:${response.data}`);
        return response.data.events;
    }

    async getAllTeams(): Promise<any> {
        const teams = [];
        const response = await axios.get(this.API_BASE_URL + "teams")
            .catch((error: any) => {
                console.error("[ERROR] Request failed. Check your network or ensure that you're not rate-limited.", error);
            }) as AxiosResponse;
        // console.log(response.data.sports[0].leagues[0].teams);

        response.data.sports[0].leagues[0].teams.forEach((team) => {
            teams.push(team.team);
        });
        // console.log(teams);
        return teams;

    }

    async getAllBoxScores(eventIds: number[]): Promise<Array<any>> {

        //For testing purposes only, reduces amount of requests sent
        // eventIds = eventIds.slice(0, 200);

        const BATCH_SIZE = 50;
        let batchNumber = 0;
        let boxscoreIdx = 0;
        const boxScores = new Array(eventIds.length);
        const promises = new Array(eventIds.length);

        for (let i = 0; i < eventIds.length; i += BATCH_SIZE) {
            const batchedEventIds = eventIds.slice(i, Math.min(i + BATCH_SIZE, eventIds.length));

            for (let event of batchedEventIds) {
                promises[boxscoreIdx] = this.reqDataWithRetries(`https://cdn.espn.com/core/nfl/boxscore?xhr=1&gameId=${event}`, boxscoreIdx);
                await sleep(delays.BETWEEN_REQUESTS);//waits between requests if delay level > 1
                boxscoreIdx++;
            }
            console.info(`Batch ${batchNumber++} of ${Math.ceil(eventIds.length / BATCH_SIZE)} fetched.`);
            await sleep(delays.BETWEEN_BATCHES); //allow time between batches for server to fulfill requests
            if (batchNumber % 5 === 0) {
                await sleep(delays.BETWEEN_BATCH_CHUNKS); //after 5 batches wait even longer
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

    private iterationsWithoutRetry = 25;



    //TODO: FIX DELAY LOGIC
    private async reqDataWithRetries(url: string, index: number, retries: number = 3): Promise<AxiosResponse> {
        try {
            if (this.iterationsWithoutRetry < 25) await sleep(delays.AFTER_FAILED_REQUEST);
            // longer delay if a request has recently failed
            const res = await axios.get(url);
            this.iterationsWithoutRetry++;
            return res;
        } catch (error: any) {
            this.iterationsWithoutRetry = 0;
            if (retries > 0) {
                console.warn(`Retrying... (${3 - retries + 1})`);
                return this.reqDataWithRetries(url, index, retries - 1);
            } else if (retries === 0) {
                console.warn(`Last retry for index ${index}`);
                await sleep(1000);
                return this.reqDataWithRetries(url, index, retries - 1);
            } else {
                console.error(`Error: at index: ${index}`);
                throw new Error(error);
            }
        }
    }


}