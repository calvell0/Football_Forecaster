package com.football.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.util.Date;

@JsonIgnoreProperties(ignoreUnknown = true)
@Table("nfl_event")
public class NFLEvent {

    @Id
    private int id;

    private String uid;
    private Date date;
    private String shortName;
    private int seasonYear;
    private int competitionType;
    private boolean isConferenceCompetition;
    private boolean isNeutralSite;
    private Team homeTeam;
    private Team awayTeam;
    private String status;


}
