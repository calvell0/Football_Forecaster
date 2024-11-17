

export interface DataClient {

    getAllEvents(year: string): Promise<any>;
    getAllTeams(): Promise<any>;
    getAllBoxScores(eventIds: number[]): Promise<Array<any>>;
}