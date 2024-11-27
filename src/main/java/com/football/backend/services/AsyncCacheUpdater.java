package com.football.backend.services;

import com.football.backend.models.NFLEvent;
import com.football.backend.models.ScheduleCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CountDownLatch;

@Service
public class AsyncCacheUpdater {

    private static final Logger log = LoggerFactory.getLogger(AsyncCacheUpdater.class);

    private final DataService dataService;
    private final ScheduleCache cache;

    public AsyncCacheUpdater(DataService dataService, ScheduleCache cache) {
        this.dataService = dataService;
        this.cache = cache;
    }

    /**
     * Asynchronously updates the cache of scheduled events
     * @param latch CountDownLatch to block other threads from accessing the cache while it is being initialized
     */
    @Async
    public void updateCache(CountDownLatch latch) {
        try {
            dataService.updateData();
            ZonedDateTime now = ZonedDateTime.now();

            var scheduledEvents = dataService.getMappedEvents()
                    .stream()
                    .filter(event -> eventDateIsAfterNow(event, now))
                    .toList();
            cache.setCache(scheduledEvents);

            log.info("Asynchronous cache update completed");
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            latch.countDown(); //unblock other threads after cache update is complete
        }
    }

    private static boolean eventDateIsAfterNow(NFLEvent event, ZonedDateTime now) {
        DateTimeFormatter iso9075Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        LocalDateTime localDateTime = event.getDate();
        ZonedDateTime eventDateTime = localDateTime.atZone(ZoneId.systemDefault());

        return eventDateTime.isAfter(now);
    }
}