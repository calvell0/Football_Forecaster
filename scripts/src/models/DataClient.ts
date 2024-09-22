import {Game} from "./Game";
import {Team} from "./Team";

export interface DataService{

    getAllGames(): Promise<void>;
    getAllTeams(): Promise<void>;
}