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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
  /*  @GetMapping("/findGameDate")
    @ResponseBody
    public Map<String, Object> findGameDate(@RequestParam("homeTeamId") int homeTeamId, @RequestParam("awayTeamId") int awayTeamId) {
        Map<String, Object> response = new HashMap<>();

        // Query the database for an event with matching home and away team IDs
        Optional<NFLEvent> nflEventOpt = nflEventRepository.findByHomeTeamAndAwayTeam(homeTeamId, awayTeamId);

        if (nflEventOpt.isPresent()) {
            NFLEvent nflEvent = nflEventOpt.get();
            response.put("date", nflEvent.getDate().toString()); // Convert date to string for easier frontend handling
            response.put("status", "found");
        } else {
            response.put("status", "not_found");
        }

        return response;
    }*/

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
