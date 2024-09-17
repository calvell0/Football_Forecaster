import {Game} from "./Game";

export interface DataService{

    getAllGames(): Game[];
    getTeams(): Team[];
}