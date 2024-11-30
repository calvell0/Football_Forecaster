package com.football.backend.services;

import com.football.backend.config.APIProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Class that manages external API calls and responses
 */
@Component
public class APIService {

    private final RestTemplate restTemplate;
    private final APIProperties apiProperties;
    private final String API_BASE_URL;

    @Autowired
    public APIService(RestTemplateBuilder restTemplateBuilder, APIProperties apiProperties) {
        this.restTemplate = restTemplateBuilder.build();
        this.apiProperties = apiProperties;
        this.API_BASE_URL = apiProperties.getBaseUrl();
    }

    public ResponseEntity<String> getNFLEventData() {
        String url = API_BASE_URL + "scoreboard?limit=1000&dates=2024" ;//+ "scoreboard?limit=1000&dates=2024"
        return restTemplate.getForEntity(url, String.class);
    }

    public ResponseEntity<String> getTeamStats(int teamId) {
        String url ="https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams/"+ teamId + "/statistics";
        return restTemplate.getForEntity(url, String.class);
    }

    public ResponseEntity<String> getTeamRecords(int teamId){
        String url = "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams/" + teamId + "/record?lang=en&region=us";
        return restTemplate.getForEntity(url, String.class);
    }





}
