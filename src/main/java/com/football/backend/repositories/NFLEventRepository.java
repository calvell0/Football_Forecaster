package com.football.backend.repositories;

import com.football.backend.models.NFLEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListPagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public interface NFLEventRepository extends ListPagingAndSortingRepository<NFLEvent, Integer> {
    Logger log = LoggerFactory.getLogger(NFLEventRepository.class);
    NFLEvent findById(Integer id);
    NFLEvent save(NFLEvent event);
    void saveAll(List<NFLEvent> events);

    @Query("SELECT e.id FROM nfl_event e WHERE e.id IN (:ids)")
    List<Integer> findAllByIds(@Param("ids") Iterable<Integer> ids);

    /**
     * Bulk save a list of NFLEvents to the database.
     * @param events
     */
    default void batchPersist(List<NFLEvent> events){

        /*
            In order to save/update events properly, we need to split the list of events into two lists
            based on whether the events exist in the database yet or not.
         */

        final int BATCH_SIZE = 50;

        /*
         * split the list into batches of BATCH_SIZE
         */
        for (int i = 0; i < events.size(); i += BATCH_SIZE){

            List<NFLEvent> batch = events.subList(i, Math.min(i + BATCH_SIZE, events.size()));

            Set<Integer> idSublist = batch
                    .stream()
                    .map(NFLEvent::getId)
                    .collect(Collectors.toSet());

            Set<Integer> existingIds = new HashSet<>(findAllByIds(idSublist));

            List<NFLEvent> newEvents = batch.stream()
                    .filter(event -> !existingIds.contains(event.getId()))
                    .toList();

            //ensure that all new events are recognized as new by repository
            newEvents.forEach(event -> event.setNew(true));

            List<NFLEvent> existingEvents = batch.stream()
                    .filter(event -> existingIds.contains(event.getId()))
                    .toList();

            log.info("Saving {} new events", newEvents.size());
            saveAll(newEvents);
            log.info("Updating {} existing events", existingEvents.size());
            saveAll(existingEvents);
        }



    }

    default void persist(NFLEvent event){

    }
}
