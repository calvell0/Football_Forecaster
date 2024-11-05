package com.football.backend.repositories;

import com.football.backend.models.Competitor;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListPagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.util.Pair;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

public interface CompetitorRepository extends ListPagingAndSortingRepository<Competitor, Integer> {
    Competitor findByInstanceId(Integer id);
    Competitor findByTeamIdAndEventId(int teamId, int eventId);
    Competitor save(Competitor competitor);
    void saveAll(Iterable<Competitor> competitors);

    @Query("SELECT team_id, event_id, instance_id " +
            "FROM competitor " +
            "WHERE (team_id, event_id) IN (:ids)")
    List<CompetitorInfo> findIdsByTeamIdAndEventId(@Param("ids") List<Pair<Integer, Integer>> ids);


    default List<CompetitorInfo> matchInstanceIds(List<CompetitorInfo> compInfo){
        List<Pair<Integer, Integer>> pairs = compInfo.stream()
                .map(comp -> Pair.of(comp.teamId(), comp.eventId()))
                .toList();
        return findIdsByTeamIdAndEventId(pairs);
    }

    default void batchPersist(List<Competitor> competitors){
        var compInfo = CompetitorInfo.fromCompetitors(competitors);
        var compIds = matchInstanceIds(compInfo);
        Map<Integer, CompetitorInfo> infoMap =
    }

    /**
     * Convenience object that stores ids of a competitor
     * @param teamId
     * @param eventId
     * @param instanceId
     */
    record CompetitorInfo(Integer teamId, Integer eventId, Integer instanceId){

        CompetitorInfo(Integer teamId, Integer eventId){
            this(teamId, eventId, null);
        }

        static List<CompetitorInfo> fromCompetitors(List<Competitor> competitors){
            return competitors.stream()
                    .map(comp -> new CompetitorInfo(comp.getTeamId(), comp.getEventId()))
                    .toList();
        }

    }
}
