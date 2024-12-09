package com.football.backend.services;

import com.football.backend.config.APIProperties;
import com.football.backend.models.OutcomeForecast;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.CompletableFuture;

/**
 * Class that manages external API calls and responses
 */
@Component
public class APIService {

    private final RestTemplate restTemplate;
    private final APIProperties apiProperties;
    private final String API_BASE_URL;
    private final int MODEL_PORT = 5000;

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

    @Async
    public CompletableFuture<ResponseEntity<String>> getTeamStats(int teamId) {
        String url ="https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams/"+ teamId + "/statistics";
        return CompletableFuture.completedFuture(restTemplate.getForEntity(url, String.class));
    }

    @Async
    public CompletableFuture<ResponseEntity<String>> getTeamRecords(int teamId){
        String url = "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2024/types/2/teams/" + teamId + "/record?lang=en&region=us";
        return CompletableFuture.completedFuture(restTemplate.getForEntity(url, String.class));
    }

    public OutcomeForecast getPrediction(float[] input) {
        String url = "http://localhost:" + MODEL_PORT + "/predict";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<float[]> request = new HttpEntity<>(input, headers);

        return restTemplate.postForObject(url, request, OutcomeForecast.class);
    }





}
