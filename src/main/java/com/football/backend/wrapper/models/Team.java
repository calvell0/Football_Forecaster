package com.football.backend.wrapper.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties
public class Team {

    private String id;
    private String name;
    private String abbreviation;

    private TeamStatisticDescriptor[] teamStatistics;
}
