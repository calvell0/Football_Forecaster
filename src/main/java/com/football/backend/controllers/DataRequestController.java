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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DataRequestController {

    private final Logger log = LoggerFactory.getLogger(DataRequestController.class);
    private final TeamRepository teamRepository;
    private final ScheduleCacheManager scheduleCacheManager;

    @Autowired
    public DataRequestController(TeamRepository teamRepository, ScheduleCacheManager scheduleCacheManager) {
        this.teamRepository = teamRepository;
        this.scheduleCacheManager = scheduleCacheManager;
    }

    @GetMapping("/teams")
    public List<Team> getTeams() {
        log.info("GET /teams");
        return teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
    }


    @GetMapping("/schedule")
    public List<NFLEvent> getEvents(){
        log.info("GET /schedule");
        return scheduleCacheManager.getScheduledEvents();
    }
}
