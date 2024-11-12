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
}
