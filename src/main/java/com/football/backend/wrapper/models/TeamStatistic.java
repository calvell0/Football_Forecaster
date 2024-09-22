package com.football.backend.wrapper.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Optional;

@JsonIgnoreProperties
public class TeamStatistic {


    private String name;
    private String displayName;
    private String shortDisplayName;
    private Double value;
    private Double perGameValue; //may be null
    private int rank;
    private String rankDisplayValue;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getShortDisplayName() {
        return shortDisplayName;
    }

    public void setShortDisplayName(String shortDisplayName) {
        this.shortDisplayName = shortDisplayName;
    }

    public Double getValue() {
        return this.value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public Optional<Double> getPerGameValue() {
        return Optional.ofNullable(this.perGameValue);
    }

    public void setPerGameValue(Double perGameValue) {
        this.perGameValue = perGameValue;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getRankDisplayValue() {
        return rankDisplayValue;
    }

    public void setRankDisplayValue(String rankDisplayValue) {
        this.rankDisplayValue = rankDisplayValue;
    }
}
