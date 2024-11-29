package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.backend.models.Competitor;
import com.football.backend.models.NFLEvent;
import com.football.backend.models.Team;
import com.football.backend.repositories.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Iterator;
import java.util.List;

@Service
public class JSONObjectMapper {

    private final Logger LOG = LoggerFactory.getLogger(JSONObjectMapper.class);

    private final ObjectMapper mapper;
    private final TeamRepository teamRepository;

    @Autowired
    public JSONObjectMapper(ObjectMapper mapper, TeamRepository teamRepository) {
        this.mapper = mapper;
        this.teamRepository = teamRepository;
    }


    public void parseEventsAndCompetitors(ResponseEntity<String> response, List<NFLEvent> newMappedEvents, List<Competitor> newMappedCompetitors) throws JsonProcessingException {

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


                int competitionType = 0;

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

                newMappedEvents.add(newEvent);

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
                    newMappedCompetitors.add(newCompetitor);
                }

            } catch (Exception e) {
                LOG.error("Exception type: {}", e.getClass().getName());
                LOG.error("Error parsing event data: {}", e.getMessage());
                throw e;
            }
        }

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

}
