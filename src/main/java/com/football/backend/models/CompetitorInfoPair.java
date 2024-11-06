package com.football.backend.models;

public record CompetitorInfoPair(IdentifyingCompetitorData team1, IdentifyingCompetitorData team2) {
    public IdentifyingCompetitorData getByTeamId(int teamId){
        if (team1.getTeamId() == teamId) return team1;
        else if (team2.getTeamId() == teamId) return team2;
        else return null;
    }
}
