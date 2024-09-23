import {DataService} from "../services/DataService";
import {MockDataClient} from "./MockDataClient";


const dataService = new DataService(new MockDataClient());