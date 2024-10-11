package com.football.backend.services;

import com.football.backend.config.APIProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;

@Component
public class APIService {

    private final RestTemplate restTemplate;

    private final APIProperties apiProperties;

    @Autowired
    public APIService(RestTemplateBuilder restTemplateBuilder, APIProperties apiProperties) {
        this.restTemplate = restTemplateBuilder.build();
        this.apiProperties = apiProperties;
    }










}
