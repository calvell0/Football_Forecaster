import eventData from "./test_data/events.json";
export class MockDataClient {
    async getAllEvents() {
        return eventData.events;
    }
    async getAllTeams() {
        // const teams: Team[] =[];
        // teamData.sports[0].leagues[0].teams.forEach((team) => {
        //     teams.push(team.team);
        // });
        // return teams;
    }
}
