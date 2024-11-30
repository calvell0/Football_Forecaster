package com.football.backend.controllers;

import ai.onnxruntime.OrtException;
import com.football.backend.models.Logo;
import com.football.backend.models.NFLEvent;
import com.football.backend.models.Team;
import com.football.backend.models.OutcomeForecast;
import com.football.backend.repositories.LogoRepository;
import com.football.backend.repositories.NFLEventRepository;
import com.football.backend.repositories.TeamRepository;
import com.football.backend.services.DataService;
import com.football.backend.services.ModelForecast;
import com.football.backend.services.ScheduleCacheManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.configurationprocessor.json.JSONException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.util.*;

@Controller
public class WebController {

    private final static Logger LOG = LoggerFactory.getLogger(WebController.class);

    private final TeamRepository teamRepository;
    private final ScheduleCacheManager cacheManager;
    private final NFLEventRepository nflEventRepository;
    private final LogoRepository logoRepository;
    private final DataService dataService;

    @Autowired
    public WebController(TeamRepository teamRepository, ScheduleCacheManager cacheManager, NFLEventRepository nflEventRepository, LogoRepository logoRepository, DataService dataService) {
        this.teamRepository = teamRepository;
        this.cacheManager = cacheManager;
        this.nflEventRepository = nflEventRepository;
        this.logoRepository = logoRepository;
        this.dataService = dataService;
    }

    @GetMapping("/")
    public String home (Model model) {
        List<Team> teams = teamRepository.findAll(Sort.by(Sort.Order.asc("id")));

        List<NFLEvent> scheduledEvents = this.cacheManager.getScheduledEvents();
        List<Logo> logos = logoRepository.findAll();
        LOG.info(scheduledEvents.get(0).toString());
        model.addAttribute("teams", teams);
        model.addAttribute("logos", logos);
        model.addAttribute("scheduledEvents", scheduledEvents);
        return "index";
    }


    @GetMapping("/prediction")
    public String matchupPrediction(@RequestParam(name = "home") int homeId,
                                    @RequestParam(name = "away") int awayId,
                                    Model model) {
        Team home = teamRepository.findById(homeId);
        Team away = teamRepository.findById(awayId);

        Logo homeLogo = logoRepository.findOneByTeamId(homeId);
        Logo awayLogo = logoRepository.findOneByTeamId(awayId);
        String homeColor = home.getColor();
        String awayColor = away.getColor();

        // Access href field directly
        String homeLogoUrl = (homeLogo != null && homeLogo.getHref() != null)
                ? homeLogo.getHref()
                : "/images/default-home-logo.png";

        String awayLogoUrl = (awayLogo != null && awayLogo.getHref() != null)
                ? awayLogo.getHref()
                : "/images/default-away-logo.png";
        OutcomeForecast prediction;
        try {
            var modelInput = ModelForecast.prepareModelInput(this.dataService.fetchTeamStatistics(homeId, awayId));
            prediction = ModelForecast.getPrediction(modelInput);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (JSONException | OrtException e) {
            throw new RuntimeException(e);
        }

        model.addAttribute("homeTeam", home);
        model.addAttribute("awayTeam", away);
        model.addAttribute("homeLogoUrl", homeLogoUrl);
        model.addAttribute("awayLogoUrl", awayLogoUrl);
        model.addAttribute("homeTeamColor", homeColor);
        model.addAttribute("awayTeamColor", awayColor);
        model.addAttribute("prediction", prediction);

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
