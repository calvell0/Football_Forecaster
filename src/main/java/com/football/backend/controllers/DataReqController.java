package com.football.backend.controllers;

import com.football.backend.repositories.TeamRepository;
import com.football.backend.wrapper.models.Team;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class DataReqController {

    private final TeamRepository teamRepository;
    @Autowired
    public DataReqController(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @GetMapping("/teams")
    public List<Team> getTeams() {
        return teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
    }
}
