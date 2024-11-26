package com.football.backend.controllers;

import com.football.backend.models.NFLEvent;
import com.football.backend.repositories.TeamRepository;
import com.football.backend.models.Team;
import com.football.backend.services.ScheduleCacheManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class RESTController {

    private final Logger LOG = LoggerFactory.getLogger(RESTController.class);
    private final TeamRepository teamRepository;
    private final ScheduleCacheManager cacheManager;

    @Autowired
    public RESTController(TeamRepository teamRepository, ScheduleCacheManager cacheManager) {
        this.teamRepository = teamRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Get all events with the given home and away team IDs
     * @param homeTeamId
     * @param awayTeamId
     * @return
     * notes: Changed route from /findGameDate to /events to more closely follow REST conventions
     */
    @GetMapping("/events")
    public ResponseEntity<List<NFLEvent>> findGameDate(@RequestParam("homeId") int homeTeamId, @RequestParam("awayId") int awayTeamId) {
        LOG.info("Searching for events with Home Team ID: {} and Away Team ID: {}", homeTeamId, awayTeamId);

        long start = new Date().getTime();
        var queriedEvents = cacheManager.getScheduledEvents()
                .stream()
                .filter(event -> event.containsTeams(homeTeamId, awayTeamId))
                .toList();

        LOG.info("Search took {} ms", new Date().getTime() - start);

        if (queriedEvents.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        var response = new ResponseEntity<>(queriedEvents, HttpStatus.OK);
        LOG.info(response.toString());
        return response;
    }


    @GetMapping("/teams")
    public List<Team> getTeams() {
        LOG.info("GET /teams");
        return teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
    }



    @GetMapping("/events/schedule")
    public List<NFLEvent> getEvents(){
        LOG.info("GET /schedule");
        return cacheManager.getScheduledEvents();
    }
}
