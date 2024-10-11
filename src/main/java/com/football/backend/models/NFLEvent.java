package com.football.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("nfl_event")
public class NFLEvent {

    @Id
    private int id;
}
