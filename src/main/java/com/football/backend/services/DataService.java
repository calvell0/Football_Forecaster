package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.football.backend.models.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

/**
 * Class that manages API response data and maps it to model objects
 */
@Component
public class DataService {

    private static final Logger log = LoggerFactory.getLogger(DataService.class);

    private static final int ESTIMATED_NUM_OF_EVENTS = 400;

    private final APIService apiService;
    private List<NFLEvent> mappedEvents;
    private List<Competitor> mappedCompetitors;
    private final JSONObjectMapper jsonObjectMapper;

    @Autowired
    public DataService(APIService apiService, JSONObjectMapper jsonObjectMapper) {
        this.apiService = apiService;
        this.jsonObjectMapper = jsonObjectMapper;
        this.mappedEvents = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS);
        this.mappedCompetitors = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS * 2); // 2 competitors for each event
    }

    public List<NFLEvent> getEvents() {
        return this.mappedEvents;
    }

    public List<Competitor> getMappedCompetitors() {
        return mappedCompetitors;
    }

    public void updateEvents(){
        try {
            ResponseEntity<String> response = apiService.getNFLEventData();
            List<NFLEvent> newMappedEvents = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS);
            List<Competitor> newMappedCompetitors = new ArrayList<>(ESTIMATED_NUM_OF_EVENTS * 2);
            this.jsonObjectMapper.parseEventsAndCompetitors(response, newMappedEvents, newMappedCompetitors);
            this.mappedCompetitors = newMappedCompetitors;
            this.mappedEvents = newMappedEvents;
            log.info("Events and competitors parsed and loaded into memory");
        } catch (JsonProcessingException e) {
            log.error("Error parsing JSON response: {}", e.getMessage());
        }
    }

    public CompetitorStats[] fetchTeamStatistics(int homeId, int awayId){
        CompetitorStats[] competitorStats = new CompetitorStats[]{
                new CompetitorStats(),
                new CompetitorStats()
        };

        try {
            CompletableFuture<ResponseEntity<String>> homeStatsResponse = apiService.getTeamStats(homeId);
            CompletableFuture<ResponseEntity<String>> awayStatsResponse = apiService.getTeamStats(awayId);
            CompletableFuture<ResponseEntity<String>> homeRecordsResponse = apiService.getTeamRecords(homeId);
            CompletableFuture<ResponseEntity<String>> awayRecordsResponse = apiService.getTeamRecords(awayId);

            //await completion of all async requests
            CompletableFuture.allOf(homeStatsResponse, awayStatsResponse, homeRecordsResponse, awayRecordsResponse).join();

            this.jsonObjectMapper.parseTeamStatsAndRecords(
                    homeStatsResponse.get(),
                    awayStatsResponse.get(),
                    homeRecordsResponse.get(),
                    awayRecordsResponse.get(),
                    competitorStats
            );

            log.info(Arrays.toString(competitorStats));

            log.info("Team statistics parsed and loaded into memory");
        } catch (JsonProcessingException e) {
            log.error("Error parsing JSON response: {}", e.getMessage());
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return competitorStats;
    }


}

record Records(int homeWins, int homeLosses, int awayWins, int awayLosses) { }
