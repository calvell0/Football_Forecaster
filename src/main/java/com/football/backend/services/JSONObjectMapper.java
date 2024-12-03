package com.football.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.football.backend.models.Competitor;
import com.football.backend.models.CompetitorStats;
import com.football.backend.models.NFLEvent;
import com.football.backend.models.Team;
import com.football.backend.repositories.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class JSONObjectMapper {

    private final Logger LOG = LoggerFactory.getLogger(JSONObjectMapper.class);

    private final ObjectMapper mapper;
    private final TeamRepository teamRepository;

    @Autowired
    public JSONObjectMapper(ObjectMapper mapper, TeamRepository teamRepository) {
        this.mapper = mapper;
        this.teamRepository = teamRepository;
    }


    public void parseEventsAndCompetitors(ResponseEntity<String> response, List<NFLEvent> newMappedEvents, List<Competitor> newMappedCompetitors) throws JsonProcessingException {

        JsonNode root = mapper.readTree(response.getBody());

        // Iterate through the events
        Iterator<JsonNode> events = root.get("events").elements();


        while (events.hasNext()) {
            try {
                JsonNode event = events.next();

                // Skip events that don't have active teams
                if (!hasActiveTeam(event)) {
                    continue;
                }

                // Extract event data
                int id = event.get("id").asInt();
                String uid = event.get("uid").asText();
                // Convert the date string to LocalDateTime
                LocalDateTime date = parseAndFormatDateString(event.get("date").asText());
                String shortName = event.get("shortName").asText();
                int seasonYear = event.get("season").get("year").asInt();
                JsonNode competition = event.get("competitions").get(0);
                boolean isConferenceCompetition = competition.get("conferenceCompetition").asBoolean();
                boolean isNeutralSite = competition.get("neutralSite").asBoolean();
                int homeId = competition.get("competitors").get(0).get("id").asInt();
                int awayId = competition.get("competitors").get(1).get("id").asInt();
                Team homeTeam = teamRepository.findById(homeId);
                Team awayTeam = teamRepository.findById(awayId);
                String status = competition.get("status").get("type").get("name").asText();


                int competitionType = 0;

                NFLEvent newEvent = new NFLEvent(id,
                        uid,
                        date,
                        shortName,
                        seasonYear,
                        competitionType,
                        isConferenceCompetition,
                        isNeutralSite,
                        homeTeam,
                        awayTeam,
                        status
                );

                newMappedEvents.add(newEvent);

                JsonNode competitorsRootNode = competition.get("competitors");
                JsonNode[] competitors = { competitorsRootNode.get(0), competitorsRootNode.get(1) };

                // Extract and create Competitor objects
                for (JsonNode competitor : competitors) {
                    int teamId = competitor.get("id").asInt();
                    JsonNode winnerNode = competitor.get("winner");
                    Boolean winner = (winnerNode != null) ? winnerNode.asBoolean() : null;

                    Records records = parseRecords(competitor.get("records"));
                    int homeWins = records.homeWins();
                    int homeLosses = records.homeLosses();
                    int awayWins = records.awayWins();
                    int awayLosses = records.awayLosses();

                    Competitor newCompetitor = new Competitor(teamId, id, winner, homeWins, homeLosses, awayWins, awayLosses);
                    newMappedCompetitors.add(newCompetitor);
                }

            } catch (Exception e) {
                LOG.error("Exception type: {}", e.getClass().getName());
                LOG.error("Error parsing event data: {}", e.getMessage());
                throw e;
            }
        }

    }
    public void parseTeamRecords(ResponseEntity<String> records, CompetitorStats comp) throws JsonProcessingException {
        JsonNode root = mapper.readTree(records.getBody());
        JsonNode items = root.get("items");
        int recordCount = 0;//end loop early once records have been parsed
        for (Iterator<JsonNode> it = items.elements(); recordCount < 3 && it.hasNext(); ) {
            var item = it.next();
            if (item.get("name").asText().equals("overall")) {
                String[] record = item.get("summary").asText().split("-");
                comp.setTotalWins(Integer.parseInt(record[0]));
                comp.setTotalLosses(Integer.parseInt(record[1]));
                recordCount++;
            }
            else if (item.get("name").asText().equals("Home")) {
                String[] record = item.get("summary").asText().split("-");
                comp.setHomeWins(Integer.parseInt(record[0]));
                comp.setHomeLosses(Integer.parseInt(record[1]));
                recordCount++;
            }
            else if (item.get("name").asText().equals("Road")) {
                String[] record = item.get("summary").asText().split("-");
                comp.setAwayWins(Integer.parseInt(record[0]));
                comp.setAwayLosses(Integer.parseInt(record[1]));
                recordCount++;
            }
        }
    }

    public void parseTeamStatsAndRecords(ResponseEntity<String> homeStats, ResponseEntity<String> awayStats, ResponseEntity<String> homeRecords, ResponseEntity<String> awayRecords, CompetitorStats[] comps) throws JsonProcessingException {

        parseTeamStatistics(homeStats, comps[0]);
        parseTeamRecords(homeRecords, comps[0]);
        parseTeamStatistics(awayStats, comps[1]);
        parseTeamRecords(awayRecords, comps[1]);

    }

    public void parseTeamStatistics (ResponseEntity<String> team, CompetitorStats comp) throws JsonProcessingException {

        JsonNode root = mapper.readTree(team.getBody());

        comp.setGamesPlayed(this.getGamesPlayed(root.get("splits").get("categories")));

        Iterator<JsonNode> categories = root.get("splits").get("categories").elements();
        int gamesPlayed = (comp.getGamesPlayed() > 0) ? comp.getGamesPlayed() : 1;


        while (categories.hasNext()){
            JsonNode category = categories.next();

            // We have to do this for defensive INTS because offensive/defensive ints are both called "interceptions"
            if (category.get("name").asText().equals("defensiveInterceptions")){
                int defInt = category.get("stats").elements().next().get("value").intValue();
                comp.setAvgDefensiveInterceptions((float) defInt / gamesPlayed);
                continue;
            }
            this.parseStatsWithReflection(category, comp);
        }

    }



    private void parseMiscStats(JsonNode misc, CompetitorStats cs) {
        for (Iterator<JsonNode> it = misc.elements(); it.hasNext(); ) {
            JsonNode stat = it.next();
            String statName = stat.get("name").asText();
            float value = stat.get("value").floatValue();
            switch (statName) {
                case "firstDownsPerGame":
                    cs.setAvgFirstDowns(value);
                    break;
                case "firstDownsPassing":
                    cs.setAvgFirstDownsPassing(value / cs.getGamesPlayed());
                    break;
                case "firstDownsPenalty":
                    cs.setAvgFirstDownsPenalty(value / cs.getGamesPlayed());
                    break;
                case "avgFirstDownsRushing":
                    cs.setAvgFirstDownsRushing(value);
                    break;
                case "fourthDownConversionPct":
                    cs.setFourthDownConversionPct(value / 100);
                    break;
                case "thirdDownConversionPct":
                    cs.setThirdDownConversionPct(value / 100);
                    break;
                case "avgFumblesLost":
                    cs.setAvgFumblesLost(value);
                    break;
                case "redZoneEfficiencyPct":
                    cs.setRedzoneConversionPct(value / 100);
                    break;
                case "avgPenalties":
                    cs.setAvgPenalties(value);
                    break;
                case "avgPenaltyYards":
                    cs.setAvgPenaltyYards(value);
                    break;
                default:
                    break;
            }
        }
    }

    private void parseStatsWithReflection(JsonNode category, CompetitorStats cs) {
        JsonNode misc = category.get("stats");
        Map<String, String> statMappings = getStatMappings();
        var averageStats = getStatsToBeAveraged();
        var proportionStats = getStatsToBeConvertedToProportion();
        int gamesPlayed = (cs.getGamesPlayed() > 0) ? cs.getGamesPlayed() : 1;

        for (Iterator<JsonNode> it = misc.elements(); it.hasNext(); ) {
            JsonNode stat = it.next();
            String statName = stat.get("name").asText();
            if (statMappings.containsKey(statName)) {
                //sacksAgainst and sacks both are called 'sacks' in the API
                if (statName.equals("sacks") && category.get("name").asText().equals("passing")){
                    statName = "sacksAgainst";
                }
                try {
                    Method method = CompetitorStats.class.getMethod(statMappings.get(statName), float.class);
                    float value = stat.get("value").floatValue();
                    if (proportionStats.contains(statName)) { //these stats need to be converted to a proportion
                        value /= 100;
                    }
                    else if (averageStats.contains(statName)) { //these stats need to be averaged over the num of games played
                        value /= gamesPlayed;
                    }

                    method.invoke(cs, value);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private static ArrayList<String> getStatsToBeAveraged(){
        String[] stats = {
                "firstDownsPassing",
                "firstDownsRushing",
                "firstDownsPenalty",
                "interceptions",
                "totalOffensivePlays",
                "rushingAttempts",
                "rushingTouchdowns",
                "passingTouchdowns",
                "passesDefended",
                "sacksAgainst",
                "sacks",
                "tacklesForLoss",
                "totalTackles",
                "defensiveTouchdowns",
                "punts",
                "fieldGoalAttempts",
                "totalGiveaways",
                "totalPenalties",
                "totalPenaltyYards",
                "fumblesLost",
                "sackYardsLost"
        };
        return new ArrayList<>(Arrays.asList(stats));
    }

    private static ArrayList<String> getStatsToBeConvertedToProportion(){
        String[] stats = {
                "fourthDownConvPct",
                "thirdDownConvPct",
                "redZoneEfficiencyPct",
                "completionPct",
                "fieldGoalPct"
        };
        return new ArrayList<>(Arrays.asList(stats));
    }

    private static Map<String, String> getStatMappings() {
        Map<String, String> statMappings = new HashMap<>();
        statMappings.put("firstDownsPerGame", "setAvgFirstDowns");
        statMappings.put("firstDownsPassing", "setAvgFirstDownsPassing");
        statMappings.put("firstDownsPenalty", "setAvgFirstDownsPenalty");
        statMappings.put("firstDownsRushing", "setAvgFirstDownsRushing");
        statMappings.put("fourthDownConvPct", "setFourthDownConversionPct");
        statMappings.put("thirdDownConvPct", "setThirdDownConversionPct");
        statMappings.put("fumblesLost", "setAvgFumblesLost");
        statMappings.put("redzoneEfficiencyPct", "setRedzoneConversionPct");
        statMappings.put("totalPenalties", "setAvgPenalties");
        statMappings.put("totalPenaltyYards", "setAvgPenaltyYards");
        statMappings.put("completionPct", "setCompletionPct");
        statMappings.put("interceptions", "setAvgInterceptions");
        statMappings.put("netYardsPerGame", "setAvgOffensiveYards");
        statMappings.put("totalOffensivePlays", "setAvgOffensivePlays");
        statMappings.put("quarterbackRating", "setAvgPasserRating");
        statMappings.put("rushingAttempts", "setAvgRushingAttempts");
        statMappings.put("rushingYardsPerGame", "setAvgRushingYards");
        statMappings.put("rushingTouchdowns", "setAvgRushingTouchdowns");
        statMappings.put("passingTouchdowns", "setAvgPassingTouchdowns");
        statMappings.put("passesDefended", "setAvgPassesDefended");
        statMappings.put("sacks", "setAvgSacks");
        statMappings.put("tacklesForLoss", "setAvgTacklesForLoss");
        statMappings.put("totalTackles", "setAvgTackles");
        statMappings.put("defensiveTouchdowns", "setAvgDefensiveTouchdowns");
        statMappings.put("yardsPerKickReturn", "setYardsPerKickReturn");
        statMappings.put("yardsPerPuntReturn", "setYardsPerPuntReturn");
        statMappings.put("netAvgPuntYards", "setYardsPerPunt");
        statMappings.put("punts", "setAvgPunts");
        statMappings.put("fieldGoalAttempts", "setAvgFieldGoalAttempts");
        statMappings.put("fieldGoalPct", "setFieldGoalPct");
        statMappings.put("totalGiveaways", "setAvgTurnovers");
        statMappings.put("sacksAgainst", "setAvgSacksAgainst");
        statMappings.put("sackYardsLost", "setAvgYardsLostSacks");
        return statMappings;
    }

    private int getGamesPlayed(JsonNode categories){
        Iterator<JsonNode> stats = categories.elements();
        
        //variables captured by lambda expressions must be final or effectively final
        AtomicInteger gamesPlayed = new AtomicInteger();
        while (stats.hasNext()){
            JsonNode stat = stats.next();
            if (stat.get("name").asText().equals("general")){
                stat.get("stats").elements().forEachRemaining(category -> {
                    if (category.get("name").asText().equals("gamesPlayed")){
                        gamesPlayed.set(category.get("value").asInt());
                    }
                });
            }
        }
        return gamesPlayed.get();
    }

    /** Given an "event" json node, check if teams are active teams
     * @param eventNode
     * @return
     */
    private static boolean hasActiveTeam(JsonNode eventNode) {
        for (JsonNode competitor : eventNode.get("competitions").get(0).get("competitors")) {
            if (competitor.get("team").get("isActive").asBoolean()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Transforms an ISO8601-formatted date string to LocalDateTime.
     * @param date - date string in ISO8601 format
     * @return - LocalDateTime object
     */
    public static LocalDateTime parseAndFormatDateString(String date) {

        DateTimeFormatter iso8601Formatter = new DateTimeFormatterBuilder()
                .appendPattern("yyyy-MM-dd'T'HH:mm")
                .optionalStart()
                .appendPattern(":ss")
                .optionalEnd()
                .appendPattern("X")
                .toFormatter();

        ZonedDateTime zdt = ZonedDateTime.parse(date, iso8601Formatter);

        return zdt.toLocalDateTime(); // Return as LocalDateTime
    }

    private static Records parseRecords(JsonNode recordNode) {
        String[] home = recordNode.get(1).get("summary").asText().split("-");
        String[] away = recordNode.get(2).get("summary").asText().split("-");
        return new Records(Integer.parseInt(home[0]), Integer.parseInt(home[1]), Integer.parseInt(away[0]), Integer.parseInt(away[1]));
    }

}
