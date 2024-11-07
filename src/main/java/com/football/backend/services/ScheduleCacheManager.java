package com.football.backend.services;

import com.football.backend.models.NFLEvent;
import com.football.backend.models.ScheduleCache;
import com.football.backend.repositories.NFLEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Date;
import java.util.List;


//TODO: Maybe refactor this class into a separate ScheduleCache and ScheduleCacheManager to adhere to SRP
//TODO: Issues with async methods not actually executing asynchronously, refactoring may help
//TODO: Maybe async methods can only be executed asynchronously when called directly from another bean?
//TODO: updateCache() is currently called from within the cacheManager so maybe that's the problem


/**
 * Class that holds a cache of scheduled events in memory, and updates the cache when necessary
 *
 */
@Component
public class ScheduleCacheManager {

    private static final Logger log = LoggerFactory.getLogger(ScheduleCacheManager.class);

    private final NFLEventRepository nflEventRepo;
    private final DataService dataService;
    private final ScheduleCache cache;


    @Autowired
    public ScheduleCacheManager(NFLEventRepository eventRepo, DataService dataService, ScheduleCache cache) {
        this.cache = cache;
        this.dataService = dataService;
        this.nflEventRepo = eventRepo;

    }

    public void initCache(){
        if (this.cache.isStale() || this.cache.getScheduledEvents() == null){
            this.updateCache();
        }
    }


    public List<NFLEvent> getScheduledEvents(){
        if (this.cache.isStale()){
            log.info("Cache miss. Refreshing cache");
            log.info("Calling async method");
            this.updateCache();
            log.info("continuing execution of main thread");
        } else log.info("Cache hit");

        var scheduledEvents = this.cache.getScheduledEvents();
        log.info(scheduledEvents.toString());

        return scheduledEvents;
    }


    @Async
    public synchronized void updateCache(){
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
//        Instant date = Instant.parse(event.getDate());
        DateTimeFormatter iso9075Formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssXXX");

        ZonedDateTime date = ZonedDateTime.parse(event.getDate(), iso9075Formatter);


        return date.isAfter(now);

    }


}
