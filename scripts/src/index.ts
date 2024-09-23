import {DataService} from "./services/DataService";
import {HttpDataClient} from "./HTTPDataClient";


const dataService = new DataService(new HttpDataClient());





