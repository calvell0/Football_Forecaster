package com.football.backend.models;


public class IdentifyingCompetitorData {
    private Integer instanceId;
    private Integer eventId;
    private Integer teamId;

    public IdentifyingCompetitorData(Integer instanceId, Integer eventId, Integer teamId) {
        this.instanceId = instanceId;
        this.eventId = eventId;
        this.teamId = teamId;
    }

    public Integer getEventId() {
        return eventId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public Integer getTeamId() {
        return teamId;
    }

    public void setTeamId(Integer teamId) {
        this.teamId = teamId;
    }

    public Integer getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(Integer instanceId) {
        this.instanceId = instanceId;
    }
}
