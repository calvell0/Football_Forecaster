package com.football.backend;


import com.football.backend.services.JSONObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class JsonParsingTests {

    private final JSONObjectMapper jsonObjectMapper;

    @Autowired
    public JsonParsingTests(JSONObjectMapper jsonObjectMapper){
        this.jsonObjectMapper = jsonObjectMapper;
    }

    @Test
    void parseStatistics(){

    }

}
