package com.football.backend.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.football.backend.models.Team;
import com.football.backend.repositories.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;

import java.util.List;


@Controller
public class WebController {
    private static final Logger logger = LoggerFactory.getLogger(WebController.class);
    private final TeamRepository teamRepository;

    @Autowired
    public WebController(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;

    }

    @GetMapping("/")
    public String index(Model model) {
        List<Team> teams = teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
        logger.info("Teams Retrieved: {}", teams);
        model.addAttribute("teams", teams);
        return "index";
    }



   /* @GetMapping("/prediction")
    public String matchupPrediction(@RequestParam(name="home") int homeId, @RequestParam(name="away") int awayId, Model model) {
        Team home = teamRepository.findById(homeId);
        Team away = teamRepository.findById(awayId);

        model.addAttribute("homeTeam", home);
        model.addAttribute("awayTeam", away);

        return "prediction"; // You can modify this if you want to redirect or load another view
    }*/



}


