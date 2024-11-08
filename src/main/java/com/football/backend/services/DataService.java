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

import java.time.LocalDateTime;
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
        this.mappedCompetitors = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS * 2); // 2 competitors for each event
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
            log.info("Events and competitors parsed and loaded into memory");
        } catch (JsonProcessingException e) {
            log.error("Error parsing JSON response: {}", e.getMessage());
        }
    }

    private void parseEventsAndCompetitors(ResponseEntity<String> response) throws JsonProcessingException {

        JsonNode root = mapper.readTree(response.getBody());

        // Iterate through the events
        Iterator<JsonNode> events = root.get("events").elements();

        while (events.hasNext()) {
            try {
                JsonNode event = events.next();

                // Skip events that don't have active teams
                if (!hasActiveTeam(event)) {
                    continue;
                }

                // Extract event data
                int id = event.get("id").asInt();
                String uid = event.get("uid").asText();
                // Convert the date string to LocalDateTime
                LocalDateTime date = parseAndFormatDateString(event.get("date").asText());
                String shortName = event.get("shortName").asText();
                int seasonYear = event.get("season").get("year").asInt();
                JsonNode competition = event.get("competitions").get(0);
                boolean isConferenceCompetition = competition.get("conferenceCompetition").asBoolean();
                boolean isNeutralSite = competition.get("neutralSite").asBoolean();
                int homeId = competition.get("competitors").get(0).get("id").asInt();
                int awayId = competition.get("competitors").get(1).get("id").asInt();
                Team homeTeam = teamRepository.findById(homeId);
                Team awayTeam = teamRepository.findById(awayId);
                String status = competition.get("status").get("type").get("name").asText();


                Integer competitionType = 0;

                NFLEvent newEvent = new NFLEvent(id,
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

                // Extract and create Competitor objects
                for (JsonNode competitor : competitors) {
                    int teamId = competitor.get("id").asInt();
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

            } catch (Exception e) {
                log.error("Exception type: {}", e.getClass().getName());
                log.error("Error parsing event data: {}", e.getMessage());
                throw e;
            }
        }
    }


    /**
     * Transforms an ISO8601-formatted date string to LocalDateTime.
     * @param date - date string in ISO8601 format
     * @return - LocalDateTime object
     */
    public static LocalDateTime parseAndFormatDateString(String date) {

        DateTimeFormatter iso8601Formatter = new DateTimeFormatterBuilder()
                .appendPattern("yyyy-MM-dd'T'HH:mm")
                .optionalStart()
                .appendPattern(":ss")
                .optionalEnd()
                .appendPattern("X")
                .toFormatter();

        ZonedDateTime zdt = ZonedDateTime.parse(date, iso8601Formatter);

        return zdt.toLocalDateTime(); // Return as LocalDateTime
    }

    private static Records parseRecords(JsonNode recordNode) {
        String[] home = recordNode.get(1).get("summary").asText().split("-");
        String[] away = recordNode.get(2).get("summary").asText().split("-");
        return new Records(Integer.parseInt(home[0]), Integer.parseInt(home[1]), Integer.parseInt(away[0]), Integer.parseInt(away[1]));
    }

    /** Given an "event" json node, check if teams are active teams
     * @param eventNode
     * @return
     */
    private static boolean hasActiveTeam(JsonNode eventNode) {
        for (JsonNode competitor : eventNode.get("competitions").get(0).get("competitors")) {
            if (competitor.get("team").get("isActive").asBoolean()) {
                return true;
            }
        }
        return false;
    }

}

record Records(int homeWins, int homeLosses, int awayWins, int awayLosses) { }
