package com.football.backend.services;

import java.io.IOException;

import com.football.backend.models.CompetitorStats;
import com.football.backend.models.OutcomeForecast;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.configurationprocessor.json.JSONException;
import org.springframework.stereotype.Service;


@Service
public class ModelForecaster {

    private final APIService apiService;

    @Autowired
    public ModelForecaster(APIService apiService) {
        this.apiService = apiService;
    }



    public OutcomeForecast getPrediction(CompetitorStats[] competitors) throws IOException, JSONException {
        float[] inputVector = createInputVector(competitors);
        //inputVector = scaleInputVector(inputVector, means, scales);
        return this.apiService.getPrediction(inputVector);
    }


    public static float[] createInputVector(CompetitorStats[] competitors) {
        if (competitors.length != 2) {
            throw new IllegalArgumentException("Only two competitors are allowed. Received: " + competitors.length);
        }
        var homeTeam = competitors[0];
        var awayTeam = competitors[1];

        return new float[]{
                homeTeam.getHomeWins(),
                homeTeam.getHomeLosses(),
                homeTeam.getAwayWins(),
                homeTeam.getAwayLosses(),
                homeTeam.getTotalWins(),
                homeTeam.getTotalLosses(),
                awayTeam.getHomeWins(),
                awayTeam.getHomeLosses(),
                awayTeam.getAwayWins(),
                awayTeam.getAwayLosses(),
                awayTeam.getTotalWins(),
                awayTeam.getTotalLosses(),
                homeTeam.getAvgFirstDowns(),
                homeTeam.getAvgFirstDownsPassing(),
                homeTeam.getAvgFirstDownsRushing(),
                homeTeam.getAvgFirstDownsPenalty(),
                homeTeam.getThirdDownConversionPct(),
                homeTeam.getFourthDownConversionPct(),
                homeTeam.getAvgOffensivePlays(),
                homeTeam.getAvgOffensiveYards(),
//                homeTeam.getCompletionPct(),
                homeTeam.getAvgInterceptions(),
                homeTeam.getAvgSacksAgainst(),
                homeTeam.getAvgYardsLostSacks(),
                homeTeam.getAvgRushingYards(),
                homeTeam.getAvgRushingAttempts(),
                homeTeam.getRedzoneConversionPct(),
                homeTeam.getAvgPenalties(),
                homeTeam.getAvgPenaltyYards(),
                homeTeam.getAvgTurnovers(),
                homeTeam.getAvgFumblesLost(),
                homeTeam.getAvgPassingTouchdowns(),
                homeTeam.getAvgRushingTouchdowns(),
                homeTeam.getAvgPasserRating(),
                homeTeam.getAvgTackles(),
                homeTeam.getAvgSacks(),
//                homeTeam.getAvgTacklesForLoss(),
                homeTeam.getAvgPassesDefended(),
                homeTeam.getAvgDefensiveInterceptions(),
                homeTeam.getAvgDefensiveTouchdowns(),
                homeTeam.getYardsPerKickReturn(),
                homeTeam.getYardsPerPuntReturn(),
                homeTeam.getFieldGoalPct(),
                homeTeam.getAvgFieldGoalAttempts(),
                homeTeam.getAvgPunts(),
                homeTeam.getYardsPerPunt(),
                awayTeam.getAvgFirstDowns(),
                awayTeam.getAvgFirstDownsPassing(),
                awayTeam.getAvgFirstDownsRushing(),
                awayTeam.getAvgFirstDownsPenalty(),
                awayTeam.getThirdDownConversionPct(),
                awayTeam.getFourthDownConversionPct(),
                awayTeam.getAvgOffensivePlays(),
                awayTeam.getAvgOffensiveYards(),
//                awayTeam.getCompletionPct(),
                awayTeam.getAvgInterceptions(),
                awayTeam.getAvgSacksAgainst(),
                awayTeam.getAvgYardsLostSacks(),
                awayTeam.getAvgRushingYards(),
                awayTeam.getAvgRushingAttempts(),
                awayTeam.getRedzoneConversionPct(),
                awayTeam.getAvgPenalties(),
                awayTeam.getAvgPenaltyYards(),
                awayTeam.getAvgTurnovers(),
                awayTeam.getAvgFumblesLost(),
                awayTeam.getAvgPassingTouchdowns(),
                awayTeam.getAvgRushingTouchdowns(),
                awayTeam.getAvgPasserRating(),
                awayTeam.getAvgTackles(),
                awayTeam.getAvgSacks(),
//                awayTeam.getAvgTacklesForLoss(),
                awayTeam.getAvgPassesDefended(),
                awayTeam.getAvgDefensiveInterceptions(),
                awayTeam.getAvgDefensiveTouchdowns(),
                awayTeam.getYardsPerKickReturn(),
                awayTeam.getYardsPerPuntReturn(),
                awayTeam.getFieldGoalPct(),
                awayTeam.getAvgFieldGoalAttempts(),
                awayTeam.getAvgPunts(),
                awayTeam.getYardsPerPunt()
        };
    }

}
