package com.football.backend.controllers;

import ai.onnxruntime.OrtException;
import com.football.backend.models.NFLEvent;
import com.football.backend.models.OutcomeForecast;
import com.football.backend.repositories.TeamRepository;
import com.football.backend.models.Team;
import com.football.backend.services.DataService;
import com.football.backend.services.ModelForecast;
import com.football.backend.services.ScheduleCacheManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.configurationprocessor.json.JSONException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
public class RESTController {

    private final Logger LOG = LoggerFactory.getLogger(RESTController.class);
    private final TeamRepository teamRepository;
    private final ScheduleCacheManager cacheManager;
    private final DataService dataService;

    @Autowired
    public RESTController(TeamRepository teamRepository, ScheduleCacheManager cacheManager, DataService dataService) {
        this.teamRepository = teamRepository;
        this.cacheManager = cacheManager;
        this.dataService = dataService;
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

    @GetMapping("/matchup/forecast")
    public OutcomeForecast getPrediction(@RequestParam("homeId") int homeId, @RequestParam("awayId") int awayId) throws OrtException {
        LOG.info("getPrediction called with homeId: {} and awayId: {}", homeId, awayId);
        String homeTeam = teamRepository.findById(homeId).getDisplayName();
        String awayTeam = teamRepository.findById(awayId).getDisplayName();
        LOG.info("Predicting outcome for {} vs {}", homeTeam, awayTeam);
        try {
            var modelInput = ModelForecast.prepareModelInput(this.dataService.fetchTeamStatistics(homeId, awayId));
            return ModelForecast.getPrediction(modelInput);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }
}
