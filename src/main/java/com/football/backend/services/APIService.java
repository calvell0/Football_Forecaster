package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.backend.config.APIProperties;
import com.football.backend.models.NFLEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

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
        String url = API_BASE_URL + "scoreboard?limit=1000&dates=2024";
        return restTemplate.getForEntity(url, String.class);
    }





}
