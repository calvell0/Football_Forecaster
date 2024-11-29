package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
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
    private TeamRepository teamRepository;
    private CompetitorRepository competitorRepository;
    private NFLEventRepository eventRepository;
    private List<NFLEvent> mappedEvents;
    private List<Competitor> mappedCompetitors;
    private Set<Integer> existingEventIds;
    private JSONObjectMapper jsonObjectMapper;

    @Autowired
    public DataService(APIService apiService, TeamRepository teamRepository, CompetitorRepository competitorRepository, NFLEventRepository eventRepository, JSONObjectMapper jsonObjectMapper) {
        this.apiService = apiService;
        this.teamRepository = teamRepository;
        this.competitorRepository = competitorRepository;
        this.eventRepository = eventRepository;
        this.jsonObjectMapper = jsonObjectMapper;
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










}

record Records(int homeWins, int homeLosses, int awayWins, int awayLosses) { }
