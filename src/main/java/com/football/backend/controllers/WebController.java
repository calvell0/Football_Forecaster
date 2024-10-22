package com.football.backend.controllers;

import com.football.backend.models.Team;
import com.football.backend.models.PlaceholderPrediction;
import com.football.backend.repositories.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class WebController {

    private final TeamRepository teamRepository;
    @Autowired
    public WebController(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @GetMapping("/")
    public String home (Model model) {
        List<Team> teams = teamRepository.findAll(Sort.by(Sort.Order.asc("id")));
        model.addAttribute("teams", teams);
        return "index";
    }

    @GetMapping("/prediction")
    public String matchupPrediction(@RequestParam(name="home") int homeId, @RequestParam(name="away") int awayId, Model model) {
        Team home = teamRepository.findById(homeId);
        Team away = teamRepository.findById(awayId);
        model.addAttribute("homeTeam", home);
        model.addAttribute("awayTeam", away);
        model.addAttribute("prediction", new PlaceholderPrediction(true, 0.5));
        return "prediction";
    }
}
