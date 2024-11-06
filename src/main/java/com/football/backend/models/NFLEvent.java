package com.football.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

@JsonIgnoreProperties(ignoreUnknown = true)
@Table("nfl_event")
public class NFLEvent implements Persistable<Integer> {

    @Id
    private Integer id;

    private String uid;
    private String date;
    private String shortName;
    private int seasonYear;
    private int competitionType;
    private boolean conferenceCompetition;
    private boolean neutralSite;
    private Team homeTeam;
    private Team awayTeam;
    private String status;

    @JsonIgnore
    private boolean isNew = false;

    public NFLEvent(int id, String uid, String date, String shortName, int seasonYear, int competitionType, boolean conferenceCompetition, boolean neutralSite, Team homeTeam, Team awayTeam, String status) {
        this.id = id;
        this.uid = uid;
        this.date = date;
        this.shortName = shortName;
        this.seasonYear = seasonYear;
        this.competitionType = competitionType;
        this.conferenceCompetition = conferenceCompetition;
        this.neutralSite = neutralSite;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return this.isNew;
    }

    public void setNew(boolean isNew){
        this.isNew = isNew;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public int getSeasonYear() {
        return seasonYear;
    }

    public void setSeasonYear(int seasonYear) {
        this.seasonYear = seasonYear;
    }

    public int getCompetitionType() {
        return competitionType;
    }

    public void setCompetitionType(int competitionType) {
        this.competitionType = competitionType;
    }

    public boolean isConferenceCompetition() {
        return conferenceCompetition;
    }

    public void setConferenceCompetition(boolean conferenceCompetition) {
        this.conferenceCompetition = conferenceCompetition;
    }

    public boolean isNeutralSite() {
        return neutralSite;
    }

    public void setNeutralSite(boolean neutralSite) {
        this.neutralSite = neutralSite;
    }

    public Team getHomeTeam() {
        return homeTeam;
    }

    public void setHomeTeam(Team homeTeam) {
        this.homeTeam = homeTeam;
    }

    public Team getAwayTeam() {
        return awayTeam;
    }

    public void setAwayTeam(Team awayTeam) {
        this.awayTeam = awayTeam;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "NFLEvent{" +
                "id=" + id +
                ", uid='" + uid + '\'' +
                ", date='" + date + '\'' +
                ", shortName='" + shortName + '\'' +
                ", seasonYear=" + seasonYear +
                ", competitionType=" + competitionType +
                ", conferenceCompetition=" + conferenceCompetition +
                ", neutralSite=" + neutralSite +
                ", homeTeam=" + homeTeam +
                ", awayTeam=" + awayTeam +
                ", status='" + status + '\'' +
                ", isNew=" + isNew +
                '}';
    }
}
