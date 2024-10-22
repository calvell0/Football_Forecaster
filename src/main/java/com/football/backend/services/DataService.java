package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.backend.models.NFLEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataService {

    private APIService apiService;
    private ObjectMapper mapper;

    @Autowired
    public DataService(APIService apiService, ObjectMapper mapper) {
        this.apiService = apiService;
        this.mapper = mapper;
    }


//    public List<NFLEvent> getMappedNFLEvents() throws JsonProcessingException {
//        ResponseEntity<String> response = apiService.getNFLEventData();
//        JsonNode root = mapper.readTree(response.getBody());
//        var events = mapper.treeToValue(root.get("events"), List.class);
//        //TODO: map json response data to NFLEvent objects
//    }

}
