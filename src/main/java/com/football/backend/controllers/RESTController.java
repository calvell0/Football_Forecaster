package com.football.backend.controllers;

import com.football.backend.models.NFLEvent;
import com.football.backend.repositories.TeamRepository;
import com.football.backend.models.Team;
import com.football.backend.services.ScheduleCacheManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

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




    @GetMapping("/teams")
    public List<Team> getTeams() {
        LOG.info("GET /teams");
        return teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
    }


    @GetMapping("/schedule")
    public List<NFLEvent> getEvents(){
        LOG.info("GET /schedule");
        return cacheManager.getScheduledEvents();
    }
}
