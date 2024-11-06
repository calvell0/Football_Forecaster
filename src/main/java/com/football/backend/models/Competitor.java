package com.football.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

@JsonIgnoreProperties
@Table("competitor")
public class Competitor implements Persistable<Integer> {
    @Id
    private Integer instanceId;

    private int teamId;
    private int eventId;
    private Boolean winner = null;
    private int homeWins = 0;
    private int homeLosses = 0;
    private int awayWins = 0;
    private int awayLosses = 0;

    @JsonIgnore
    private boolean isNew = false;


    public Competitor(int teamId, int eventId, Boolean winner, int homeWins, int homeLosses, int awayWins, int awayLosses) {

        this.teamId = teamId;
        this.eventId = eventId;
        this.winner = winner;
        this.homeWins = homeWins;
        this.homeLosses = homeLosses;
        this.awayWins = awayWins;
        this.awayLosses = awayLosses;
    }

    public Integer getInstanceId(){
        return this.instanceId;
    }

    public void setInstanceId(Integer instanceId){
        this.instanceId = instanceId;
    }

    public int getTeamId() {
        return teamId;
    }

    public void setTeamId(int teamId) {
        this.teamId = teamId;
    }

    public int getEventId() {
        return eventId;
    }

    public void setEventId(int eventId) {
        this.eventId = eventId;
    }

    public Boolean getWinner() {
        return winner;
    }

    public void setWinner(Boolean winner) {
        this.winner = winner;
    }

    public int getHomeWins() {
        return homeWins;
    }

    public void setHomeWins(int homeWins) {
        this.homeWins = homeWins;
    }

    public int getHomeLosses() {
        return homeLosses;
    }

    public void setHomeLosses(int homeLosses) {
        this.homeLosses = homeLosses;
    }

    public int getAwayWins() {
        return awayWins;
    }

    public void setAwayWins(int awayWins) {
        this.awayWins = awayWins;
    }

    public int getAwayLosses() {
        return awayLosses;
    }

    public void setAwayLosses(int awayLosses) {
        this.awayLosses = awayLosses;
    }

    public int getTotalWins() {
        return this.awayWins + this.homeWins;
    }


    public int getTotalLosses() {
        return this.awayLosses + this.homeLosses;
    }

    @Override
    public Integer getId() {
        return this.instanceId;
    }

    @Override
    public boolean isNew() {
        return false;
    }

    public void setNew(boolean isNew){
        this.isNew = isNew;
    }
}
