

export interface DataClient {

    getPastEvents(yearsBack: number): Promise<any>;
    getAllTeams(): Promise<any>;
    getAllBoxScores(eventIds: number[]): Promise<Array<any>>;
}