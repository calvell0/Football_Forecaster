package com.football.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories;


@Configuration
@EnableJdbcRepositories("com.football.backend.repositories")
public class ApplicationConfig {

}
