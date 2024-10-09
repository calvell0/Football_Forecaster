package com.football.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories;

import java.net.http.HttpClient;

@Configuration
@EnableJdbcRepositories("com.football.backend.repositories")
public class ApplicationConfig {




}
