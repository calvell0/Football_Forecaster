package com.football.backend.services;

import com.football.backend.models.NFLEvent;
import com.football.backend.models.ScheduleCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.concurrent.CountDownLatch;

/**
 * Class that holds a cache of scheduled events in memory, and uses another class to update the cache when
 * the cache is out-of-date. Use this to access scheduled nfl events.
 */
@Component
public class ScheduleCacheManager {

    private static final Logger log = LoggerFactory.getLogger(ScheduleCacheManager.class);

    private final ScheduleCache cache;
    private final AsyncCacheUpdater cacheUpdater;

    //CountDownLatch allows us to create a lock over the cache once, on initialization
    private final CountDownLatch latch = new CountDownLatch(1);

    @Autowired
    public ScheduleCacheManager(ScheduleCache cache, AsyncCacheUpdater cacheUpdater) {
        this.cache = cache;
        this.cacheUpdater = cacheUpdater;
    }

    public List<NFLEvent> getScheduledEvents() {
        try {
            this.latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Thread interrupted while waiting for cache update");
        }

        if (this.cache.isStale()) {
            log.info("Cache miss. Refreshing cache");
            this.cacheUpdater.updateCache(latch);
        } else log.info("Cache hit");


        return this.cache.getScheduledEvents();
    }



    /**
     * initializes the cache data if it doesn't exist or is out-of-date
     */
    public void initCache() {
        if (this.cache.isStale() || this.cache.getScheduledEvents() == null) {
            this.cacheUpdater.updateCache(this.latch);
        }
    }


}
