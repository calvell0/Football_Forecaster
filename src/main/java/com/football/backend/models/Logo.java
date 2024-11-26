package com.football.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("logo")
public class Logo {
    @Id
    private int id;

    private String href;

    @Column("team_id")
    private int teamId;

    // Getter for href
    public String getHref() {
        return href;
    }

    public void setHref(String href) {
        this.href = href;
    }

    // Getter and setter for teamId
    public int getTeamId() {
        return teamId;
    }

    public void setTeamId(int teamId) {
        this.teamId = teamId;
    }
}
