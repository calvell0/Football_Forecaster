package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.backend.models.*;
import com.football.backend.repositories.CompetitorRepository;
import com.football.backend.repositories.NFLEventRepository;
import com.football.backend.repositories.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;

/**
 * Class that manages API response data and maps it to model objects
 */
@Component
public class DataService {

    private static final Logger log = LoggerFactory.getLogger(DataService.class);

    private static final int ESTIMATED_NUM_OF_EVENTS = 400;

    private APIService apiService;
    private ObjectMapper mapper;
    private TeamRepository teamRepository;
    private CompetitorRepository competitorRepository;
    private NFLEventRepository eventRepository;
    private List<NFLEvent> mappedEvents;
    private List<Competitor> mappedCompetitors;
    private Set<Integer> existingEventIds;


    @Autowired
    public DataService(APIService apiService, ObjectMapper mapper, TeamRepository teamRepository, CompetitorRepository competitorRepository, NFLEventRepository eventRepository) {
        this.apiService = apiService;
        this.mapper = mapper;
        this.teamRepository = teamRepository;
        this.competitorRepository = competitorRepository;
        this.eventRepository = eventRepository;
        this.mappedEvents = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS);
        this.mappedCompetitors = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS * 2); //2 competitors for each event
    }

    public List<NFLEvent> getMappedEvents() {
        return this.mappedEvents;
    }

    public List<Competitor> getMappedCompetitors() {
        return mappedCompetitors;
    }

    public void updateData(){
        try {
            ResponseEntity<String> response = apiService.getNFLEventData();
            this.parseEventsAndCompetitors(response);
            this.eventRepository.batchPersist(this.mappedEvents);
            this.splitAndPersistCompetitors(this.mappedCompetitors);
        } catch (JsonProcessingException e) {
            log.error("Error parsing JSON response: {}", e.getMessage());
        }
    }

    private void persistEventsAndCompetitors(){
        this.eventRepository.saveAll(this.mappedEvents);
        this.competitorRepository.saveAll(this.mappedCompetitors);
    }

    /*
    TODO: Refactor both "splitAndPersist" methods to have a single responsibility
    TODO: Maybe create an abstraction such that either events or competitors can be passed to the same method.
    */


    /**
     * splits a list of Competitors into 2 lists, one for competitors that already exist in the database and one
     * for competitors that don't yet exist. These 2 groups of competitors are then saved/updated in the database
     * @param competitors
     */
    private void splitAndPersistCompetitors(List<Competitor> competitors){
        //sort list to make indexing more efficient
        competitors.sort(Comparator.comparing(Competitor::getEventId));

        /*
        Here, we need to split the list of competitors into 2 lists based on whether they exist or not in the database.
        However, the instance id of the competitors in the database is generated internally by the db, so to check if
        a given competitor exists already, we need to check if the teamId and eventId are already in the database. If
        so, then we need to set the instance id of the competitor object to the instance id in the db of the associated
        team and event.
         */
        int numCompetitors = competitors.size();
        List<Competitor> newCompetitors = new ArrayList<>(numCompetitors);
        List<Competitor> existingCompetitors = new ArrayList<>(numCompetitors);

        //all competitor instance, team, and event ids
        List<IdentifyingCompetitorData> competitorIds = this.competitorRepository.findAllIds();
        competitorIds.sort(Comparator.comparing(IdentifyingCompetitorData::getEventId));

        //maps event ids to team/instance ids. 2 competitors per event, so we need to store 2 values per key
        HashMap<Integer, CompetitorInfoPair> competitorIdData = new HashMap<>();

        /*
        for competitorIds:
            map 2 IdentifyingCompetitorDatas to each eventId

        for competitors:
            if in competitorIdData:
                competitor.instanceId = competitorIdData(eventId).instanceId
         */

        CompetitorInfoPair entry;
        IdentifyingCompetitorData team1, team2;

        //putting competitor ids into hashmap
        for (int i = 0; i < competitorIds.size(); i += 2){
            team1 = competitorIds.get(i);
            team2 = competitorIds.get(i + 1);
            //I want to know if there is ever malformed data. There should ALWAYS be 2 teams for each event
            assert Objects.equals(team1.getEventId(), team2.getEventId()) : "ERROR: Malformed competitor data";
            competitorIdData.put(team1.getEventId(), new CompetitorInfoPair(team1, team2));
        }

        for (int i = 0; i < competitors.size(); i += 2){
            Competitor competitor = competitors.get(i);
            Competitor competitor2 = competitors.get(i + 1);

            assert competitor.getEventId() == competitor2.getEventId(): "ERROR: Consecutive competitor eventIds don't match";

            int eventId = competitor.getEventId();
            CompetitorInfoPair pair = competitorIdData.get(eventId);
            if (pair == null){
                newCompetitors.add(competitor);
                newCompetitors.add(competitor2);
                continue;
            }

            IdentifyingCompetitorData data1 = pair.getByTeamId(competitor.getTeamId());
            IdentifyingCompetitorData data2 = pair.getByTeamId(competitor2.getTeamId());

            //if this fails then something is very wrong
            assert data1 != null && data2 != null: "ERROR: No matching team id found in Pair";

            competitor.setInstanceId(data1.getInstanceId());
            competitor2.setInstanceId(data2.getInstanceId());
            existingCompetitors.add(competitor);
            existingCompetitors.add(competitor2);
        }

        competitorRepository.saveAll(existingCompetitors);
        competitorRepository.saveAll(newCompetitors);



    }


    private void parseEventsAndCompetitors(ResponseEntity<String> response) throws JsonProcessingException {

        /*
          we want to initialize the arraylist with enough capacity for all of our events if we can,
          so that we don't waste compute time repeatedly allocating memory for each new event
         */


        JsonNode root = mapper.readTree(response.getBody());

        //TODO: map json response data to NFLEvent objects
        Iterator<JsonNode> events = root.get("events").elements();

        while (events.hasNext()) try {
            {
                JsonNode event = events.next();
                /*
                    for each event:
                        extract data nested deeper into json structure
                        use to construct NFLEvent object, Competitor object
                        add NFLEvent object to mappedEvents list, Competitor -> Competitor list

                 */

                /*
                    DEALING WITH DATES:
                        translate response date (String, ISO8601 format) to ISO9075 format
                 */

                //Inactive teams are all-star teams. We don't care about these games.
                if (!hasActiveTeam(event)) {
                    continue;
                }




                //extracting data from json response object
                int id = event.get("id").asInt();
                String uid = event.get("uid").asText();
                //MySQL date format uses ISO9075 format, but ESPN sends us ISO8601 dates, so we need to convert them
                String date = parseAndFormatDateString(event.get("date").asText());
                String shortName = event.get("shortName").asText();
                int seasonYear = event.get("season").get("year").asInt();
                JsonNode competition = event.get("competitions").get(0);
                int competitionType = competition.get("type").get("id").asInt();
                boolean isConferenceCompetition = competition.get("conferenceCompetition").asBoolean();
                boolean isNeutralSite = competition.get("neutralSite").asBoolean();
                int homeId = competition.get("competitors").get(0).get("id").asInt();
                int awayId = competition.get("competitors").get(1).get("id").asInt();
                Team homeTeam = teamRepository.findById(homeId);
                Team awayTeam = teamRepository.findById(awayId);
                String status = competition.get("status").get("type").get("name").asText();

                var newEvent = new NFLEvent(id,
                        uid,
                        date,
                        shortName,
                        seasonYear,
                        competitionType,
                        isConferenceCompetition,
                        isNeutralSite,
                        homeTeam,
                        awayTeam,
                        status
                );

                this.mappedEvents.add(newEvent);

                JsonNode competitorsRootNode = competition.get("competitors");
                JsonNode[] competitors = { competitorsRootNode.get(0), competitorsRootNode.get(1) };

                //extracting competitor data from json response object
                for (JsonNode competitor : competitors){
                    //eventId = id
                    int teamId = competitor.get("id").asInt();

                    //Games that haven't happened yet don't have a "winner" field
                    JsonNode winnerNode = competitor.get("winner");
                    Boolean winner = (winnerNode != null) ? winnerNode.asBoolean() : null;

                    Records records = parseRecords(competitor.get("records"));
                    int homeWins = records.homeWins();
                    int homeLosses = records.homeLosses();
                    int awayWins = records.awayWins();
                    int awayLosses = records.awayLosses();

                    Competitor newCompetitor = new Competitor(teamId, id, winner, homeWins, homeLosses, awayWins, awayLosses);
                    this.mappedCompetitors.add(newCompetitor);
                }



            }
        } catch (Exception e) {
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Error parsing event data: {}", e.getMessage());
            throw e;
        }


    }

    /**
     * Transforms an ISO8601-formatted date string to ISO9075 format.
     * @param date - date string in ISO8601 format
     * @return - date string in ISO9075 format
     */
    public static String parseAndFormatDateString(String date) {


        DateTimeFormatter iso8601Formatter = new DateTimeFormatterBuilder()
                .appendPattern("yyyy-MM-dd'T'HH:mm")
                .optionalStart()
                .appendPattern(":ss")
                .optionalEnd()
                .appendPattern("X")
                .toFormatter();

        ZonedDateTime zdt = ZonedDateTime.parse(date, iso8601Formatter);

        DateTimeFormatter iso9075Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return zdt.format(iso9075Formatter);
    }

    private static Records parseRecords(JsonNode recordNode) {
        String[] home = recordNode.get(1).get("summary").asText().split("-");
        String[] away = recordNode.get(2).get("summary").asText().split("-");
        return new Records(Integer.parseInt(home[0]), Integer.parseInt(home[1]), Integer.parseInt(away[0]), Integer.parseInt(away[1]));
    }

    /**Given an "event" json node, check if teams are active teams
     *
     * @param eventNode
     * @return
     */
    private static boolean hasActiveTeam(JsonNode eventNode) {
        for (JsonNode competitor: eventNode.get("competitions").get(0).get("competitors")) {
            if (competitor.get("team").get("isActive").asBoolean()) {
                return true;
            }
        }
        return false;
    }

}

record Records(int homeWins, int homeLosses, int awayWins, int awayLosses){

};
