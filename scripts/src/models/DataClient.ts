

export interface DataClient {

    getAllEvents(): Promise<any>;
    getAllTeams(): Promise<any>;
}