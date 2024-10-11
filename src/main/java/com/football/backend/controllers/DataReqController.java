package com.football.backend.controllers;

import com.football.backend.repositories.TeamRepository;
import com.football.backend.models.Team;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DataReqController {

    private final Logger log = LoggerFactory.getLogger(DataReqController.class);
    private final TeamRepository teamRepository;
    @Autowired
    public DataReqController(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @GetMapping("/teams")
    public List<Team> getTeams() {
        log.info("GET /teams");
        return teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
    }
}
