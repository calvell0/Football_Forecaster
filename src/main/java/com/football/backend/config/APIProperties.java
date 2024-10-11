package com.football.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Config class that allows API options to be bound to variables in the application.properties file.
 */
@Component
@ConfigurationProperties(prefix = "api")
public class APIProperties {

    private String baseUrl = "";

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
}
