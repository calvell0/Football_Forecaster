package com.football.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;


public class CompetitorStats {


    private int teamId;



    @JsonIgnore
    private int gamesPlayed;
    private int homeWins;
    private int homeLosses;
    private int awayWins;
    private int awayLosses;
    private int totalWins;
    private int totalLosses;

    private float avgFirstDowns;
    private float avgFirstDownsPassing;
    private float avgFirstDownsRushing;
    private float avgFirstDownsPenalty;
    private float thirdDownConversionPct;
    private float fourthDownConversionPct;
    private float avgOffensivePlays;
    private float avgOffensiveYards;

//    private float avgDrives;//maybe remove

    private float completionPct;
    private float avgInterceptions;

    private float avgSacksAgainst;
    private float avgYardsLostSacks;
    private float avgRushingYards;
    private float avgRushingAttempts;

    private float redzoneConversionPct;
    private float avgPenalties;
    private float avgPenaltyYards;
    private float avgFumblesLost;

    private float avgTurnovers;
    private float avgPassingTouchdowns;
    private float avgRushingTouchdowns;

    private float avgPasserRating;

    private float avgTackles;
    private float avgSacks;
    private float avgTacklesForLoss;
    private float avgPassesDefended;
    private float avgDefensiveInterceptions;
    private float avgDefensiveTouchdowns;
    private float yardsPerKickReturn;
    private float yardsPerPuntReturn;
    private float fieldGoalPct;
    private float avgFieldGoalAttempts;
    private float avgPunts;
    private float yardsPerPunt;

    public float getAvgFirstDowns() {
        return avgFirstDowns;
    }

    public void setAvgFirstDowns(float avgFirstDowns) {
        this.avgFirstDowns = avgFirstDowns;
    }

    public float getAvgFirstDownsPassing() {
        return avgFirstDownsPassing;
    }

    public void setAvgFirstDownsPassing(float avgFirstDownsPassing) {
        this.avgFirstDownsPassing = avgFirstDownsPassing;
    }

    public float getAvgFirstDownsRushing() {
        return avgFirstDownsRushing;
    }

    public void setAvgFirstDownsRushing(float avgFirstDownsRushing) {
        this.avgFirstDownsRushing = avgFirstDownsRushing;
    }

    public float getAvgFirstDownsPenalty() {
        return avgFirstDownsPenalty;
    }

    public void setAvgFirstDownsPenalty(float avgFirstDownsPenalty) {
        this.avgFirstDownsPenalty = avgFirstDownsPenalty;
    }

    public float getThirdDownConversionPct() {
        return thirdDownConversionPct;
    }

    public void setThirdDownConversionPct(float thirdDownConversionPct) {
        this.thirdDownConversionPct = thirdDownConversionPct;
    }

    public float getFourthDownConversionPct() {
        return fourthDownConversionPct;
    }

    public void setFourthDownConversionPct(float fourthDownConversionPct) {
        this.fourthDownConversionPct = fourthDownConversionPct;
    }

    public float getAvgOffensivePlays() {
        return avgOffensivePlays;
    }

    public void setAvgOffensivePlays(float avgOffensivePlays) {
        this.avgOffensivePlays = avgOffensivePlays;
    }

    public float getAvgOffensiveYards() {
        return avgOffensiveYards;
    }

    public void setAvgOffensiveYards(float avgOffensiveYards) {
        this.avgOffensiveYards = avgOffensiveYards;
    }


    public float getCompletionPct() {
        return completionPct;
    }

    public void setCompletionPct(float completionPct) {
        this.completionPct = completionPct;
    }

    public float getAvgInterceptions() {
        return avgInterceptions;
    }

    public void setAvgInterceptions(float avgInterceptions) {
        this.avgInterceptions = avgInterceptions;
    }

    public float getAvgSacksAgainst() {
        return avgSacksAgainst;
    }

    public void setAvgSacksAgainst(float avgSacksAgainst) {
        this.avgSacksAgainst = avgSacksAgainst;
    }

    public float getAvgYardsLostSacks() {
        return avgYardsLostSacks;
    }

    public void setAvgYardsLostSacks(float avgYardsLostSacks) {
        this.avgYardsLostSacks = avgYardsLostSacks;
    }

    public float getAvgRushingYards() {
        return avgRushingYards;
    }

    public void setAvgRushingYards(float avgRushingYards) {
        this.avgRushingYards = avgRushingYards;
    }

    public float getAvgRushingAttempts() {
        return avgRushingAttempts;
    }

    public void setAvgRushingAttempts(float avgRushingAttempts) {
        this.avgRushingAttempts = avgRushingAttempts;
    }

    public float getRedzoneConversionPct() {
        return redzoneConversionPct;
    }

    public void setRedzoneConversionPct(float redzoneConversionPct) {
        this.redzoneConversionPct = redzoneConversionPct;
    }

    public float getAvgPenalties() {
        return avgPenalties;
    }

    public void setAvgPenalties(float avgPenalties) {
        this.avgPenalties = avgPenalties;
    }

    public float getAvgPenaltyYards() {
        return avgPenaltyYards;
    }

    public void setAvgPenaltyYards(float avgPenaltyYards) {
        this.avgPenaltyYards = avgPenaltyYards;
    }

    public float getAvgTurnovers() {
        return avgTurnovers;
    }

    public void setAvgTurnovers(float avgTurnovers) {
        this.avgTurnovers = avgTurnovers;
    }

    public float getAvgFumblesLost() {
        return avgFumblesLost;
    }

    public void setAvgFumblesLost(float avgFumblesLost) {
        this.avgFumblesLost = avgFumblesLost;
    }

    public float getAvgPassingTouchdowns() {
        return avgPassingTouchdowns;
    }

    public void setAvgPassingTouchdowns(float avgPassingTouchdowns) {
        this.avgPassingTouchdowns = avgPassingTouchdowns;
    }

    public float getAvgRushingTouchdowns() {
        return avgRushingTouchdowns;
    }

    public void setAvgRushingTouchdowns(float avgRushingTouchdowns) {
        this.avgRushingTouchdowns = avgRushingTouchdowns;
    }

    public float getAvgPasserRating() {
        return avgPasserRating;
    }

    public void setAvgPasserRating(float avgPasserRating) {
        this.avgPasserRating = avgPasserRating;
    }

    public float getAvgTackles() {
        return avgTackles;
    }

    public void setAvgTackles(float avgTackles) {
        this.avgTackles = avgTackles;
    }

    public float getAvgSacks() {
        return avgSacks;
    }

    public void setAvgSacks(float avgSacks) {
        this.avgSacks = avgSacks;
    }

    public float getAvgTacklesForLoss() {
        return avgTacklesForLoss;
    }

    public void setAvgTacklesForLoss(float avgTacklesForLoss) {
        this.avgTacklesForLoss = avgTacklesForLoss;
    }

    public float getAvgPassesDefended() {
        return avgPassesDefended;
    }

    public void setAvgPassesDefended(float avgPassesDefended) {
        this.avgPassesDefended = avgPassesDefended;
    }

    public float getAvgDefensiveInterceptions() {
        return avgDefensiveInterceptions;
    }

    public void setAvgDefensiveInterceptions(float avgDefensiveInterceptions) {
        this.avgDefensiveInterceptions = avgDefensiveInterceptions;
    }

    public float getAvgDefensiveTouchdowns() {
        return avgDefensiveTouchdowns;
    }

    public void setAvgDefensiveTouchdowns(float avgDefensiveTouchdowns) {
        this.avgDefensiveTouchdowns = avgDefensiveTouchdowns;
    }

    public float getYardsPerKickReturn() {
        return yardsPerKickReturn;
    }

    public void setYardsPerKickReturn(float yardsPerKickReturn) {
        this.yardsPerKickReturn = yardsPerKickReturn;
    }

    public float getYardsPerPuntReturn() {
        return yardsPerPuntReturn;
    }

    public void setYardsPerPuntReturn(float yardsPerPuntReturn) {
        this.yardsPerPuntReturn = yardsPerPuntReturn;
    }

    public float getFieldGoalPct() {
        return fieldGoalPct;
    }

    public void setFieldGoalPct(float fieldGoalPct) {
        this.fieldGoalPct = fieldGoalPct;
    }

    public float getAvgFieldGoalAttempts() {
        return avgFieldGoalAttempts;
    }

    public void setAvgFieldGoalAttempts(float avgFieldGoalAttempts) {
        this.avgFieldGoalAttempts = avgFieldGoalAttempts;
    }

    public float getAvgPunts() {
        return avgPunts;
    }

    public void setAvgPunts(float avgPunts) {
        this.avgPunts = avgPunts;
    }

    public float getYardsPerPunt() {
        return yardsPerPunt;
    }

    public void setYardsPerPunt(float yardsPerPunt) {
        this.yardsPerPunt = yardsPerPunt;
    }

    public int getTeamId() {
        return teamId;
    }

    public void setTeamId(int teamId) {
        this.teamId = teamId;
    }

    public int getGamesPlayed() {
        return gamesPlayed;
    }

    public void setGamesPlayed(int gamesPlayed) {
        this.gamesPlayed = gamesPlayed;
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
        return totalWins;
    }

    public void setTotalWins(int totalWins) {
        this.totalWins = totalWins;
    }

    public int getTotalLosses() {
        return totalLosses;
    }

    public void setTotalLosses(int totalLosses) {
        this.totalLosses = totalLosses;
    }


}