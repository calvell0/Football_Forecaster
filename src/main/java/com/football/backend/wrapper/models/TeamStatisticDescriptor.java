package com.football.backend.wrapper.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties
public class TeamStatisticDescriptor {

    private String name;
    private String DisplayName;
    private TeamStatistic[] statistics;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDisplayName() {
        return DisplayName;
    }

    public void setDisplayName(String displayName) {
        DisplayName = displayName;
    }

    public TeamStatistic[] getStatistics() {
        return statistics;
    }

    public void setStatistics(TeamStatistic[] statistics) {
        this.statistics = statistics;
    }
}
