package com.football.backend.services;

import com.football.backend.models.NFLEvent;
import com.football.backend.models.ScheduleCache;
import com.football.backend.repositories.NFLEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cglib.core.Local;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.time.ZoneId;


//TODO: Maybe refactor this class into a separate ScheduleCache and ScheduleCacheManager to adhere to SRP
//TODO: Issues with async methods not actually executing asynchronously, refactoring may help
//TODO: Maybe async methods can only be executed asynchronously when called directly from another bean?
//TODO: updateCache() is currently called from within the cacheManager so maybe that's the problem


/**
 * Class that holds a cache of scheduled events in memory, and updates the cache when
 * the cache is out-of-date. Use this to access scheduled nfl events.
 */
@Component
public class ScheduleCacheManager {

    private static final Logger log = LoggerFactory.getLogger(ScheduleCacheManager.class);

    private final DataService dataService;
    private final ScheduleCache cache;


    @Autowired
    public ScheduleCacheManager(DataService dataService, ScheduleCache cache) {
        this.cache = cache;
        this.dataService = dataService;

    }

    /**
     * initializes the cache data if it doesn't exist or is out-of-date
     */
    public void initCache() {
        if (this.cache.isStale() || this.cache.getScheduledEvents() == null) {
            this.updateCache();
        }
    }


    public List<NFLEvent> getScheduledEvents() {
        if (this.cache.isStale()) {
            log.info("Cache miss. Refreshing cache");
            log.info("Calling async method");
            this.updateCache();
            log.info("continuing execution of main thread");
        } else log.info("Cache hit");


        return this.cache.getScheduledEvents();
    }


    @Async
    public synchronized void updateCache() {
        this.dataService.updateData();
        ZonedDateTime now = ZonedDateTime.now();

        var scheduledEvents = this.dataService.getMappedEvents()
                .stream()
                .filter(event -> eventDateIsAfterNow(event, now))
                .toList();
        this.cache.setCache(scheduledEvents);

        log.info("asynchronous cache update completed");
    }

    private static boolean eventDateIsAfterNow(NFLEvent event, ZonedDateTime now) {
        DateTimeFormatter iso9075Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        LocalDateTime localDateTime = event.getDate();


        ZonedDateTime eventDateTime = localDateTime.atZone(ZoneId.systemDefault());

        return eventDateTime.isAfter(now);
    }


}
