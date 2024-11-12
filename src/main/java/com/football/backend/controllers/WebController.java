package com.football.backend.controllers;

import com.football.backend.models.NFLEvent;
import com.football.backend.models.Team;
import com.football.backend.models.PlaceholderPrediction;
import com.football.backend.repositories.NFLEventRepository;
import com.football.backend.repositories.TeamRepository;
import com.football.backend.services.ScheduleCacheManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.*;

@Controller
public class WebController {

    private final static Logger LOG = LoggerFactory.getLogger(WebController.class);

    private final TeamRepository teamRepository;
    private final ScheduleCacheManager cacheManager;
    private final NFLEventRepository nflEventRepository;

    @Autowired
    public WebController(TeamRepository teamRepository, ScheduleCacheManager cacheManager, NFLEventRepository nflEventRepository) {
        this.teamRepository = teamRepository;
        this.cacheManager = cacheManager;
        this.nflEventRepository = nflEventRepository;
    }

    @GetMapping("/")
    public String home (Model model) {
        List<Team> teams = teamRepository.findAll(Sort.by(Sort.Order.asc("id")));

        List<NFLEvent> scheduledEvents = this.cacheManager.getScheduledEvents();

        LOG.info(scheduledEvents.get(0).toString());
        model.addAttribute("teams", teams);
        model.addAttribute("scheduledEvents", scheduledEvents);
        return "index";
    }

    @GetMapping("/findGameDate")
    @ResponseBody
    public Map<String, Object> findGameDate(@RequestParam("homeTeamId") int homeTeamId, @RequestParam("awayTeamId") int awayTeamId) {
        LOG.info("Searching for game with Home Team ID: {} and Away Team ID: {}", homeTeamId, awayTeamId);

        Map<String, Object> response = new HashMap<>();
        long start = new Date().getTime();
        Optional<NFLEvent> nflEventOpt = Optional.of(this.cacheManager.getScheduledEvents()
                .stream()
                .filter(event -> event.containsTeams(homeTeamId, awayTeamId))
                .toList()
                .getFirst()
        );

        LOG.info("Search took {} ms", new Date().getTime() - start);

        if (nflEventOpt.isPresent()) {
            NFLEvent nflEvent = nflEventOpt.get();
            LOG.info("Game found with date: {}", nflEvent.getDate());

            response.put("date", nflEvent.getDate().toString());
            response.put("status", "found");
        } else {
            LOG.info("No game found for Home Team ID: {} and Away Team ID: {}", homeTeamId, awayTeamId);
            response.put("status", "not_found");
        }

        return response;
    }


    @GetMapping("/prediction")
    public String matchupPrediction(@RequestParam(name="home") int homeId, @RequestParam(name="away") int awayId, Model model) {
        Team home = this.teamRepository.findById(homeId);
        Team away = this.teamRepository.findById(awayId);
        model.addAttribute("homeTeam", home);
        model.addAttribute("awayTeam", away);
        model.addAttribute("prediction", new PlaceholderPrediction(true, 0.5));

        return "prediction";
    }


    /*
    SCHEDULING BUSINESS LOGIC ON "/" REQUEST
        if lastUpdated > %CACHE_DURATION% ms ago:
            send API request for schedule
            update and overwrite all matching events in DB
            match competitors in DB by event id ->
                update competitors and stats
            populate template schedule data with updated info

        CONCERNS
            fetching event data will take a while. Maybe it'll be better to
            populate the frontend with outdated schedule data, and then send
            updated data to the frontend to be overwritten after the query
            and DB update have been completed on the backend

    PREDICTION BUSINESS LOGIC ON "/prediction" REQUEST
        send API request for both current team stats ->
            feed to prediction model
            return prediction object(outcome, confidence)
     */
}
