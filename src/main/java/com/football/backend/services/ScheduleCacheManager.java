package com.football.backend.services;

import com.football.backend.models.NFLEvent;
import com.football.backend.repositories.NFLEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Class that holds a cache of scheduled events in memory, and updates the cache when necessary
 *
 */
@Service
public class ScheduleCacheManager {

    private static final Logger log = LoggerFactory.getLogger(ScheduleCacheManager.class);

    private Date lastUpdated;
    private List<NFLEvent> scheduledEvents;
    private final NFLEventRepository nflEventRepo;
    private final Sort sortStrategy;
    private final DataService dataService;

    @Value("${cache.duration}")
    private long CACHE_DURATION;


    @Autowired
    public ScheduleCacheManager(NFLEventRepository eventRepo, DataService dataService) {
        this.dataService = dataService;
        this.lastUpdated = new Date();
        this.nflEventRepo = eventRepo;
        this.sortStrategy = Sort.unsorted();
    }


    public List<NFLEvent> getScheduledEvents(){
        if (this.cacheIsStale() || this.scheduledEvents == null){
            this.updateCache();
        }
        log.info(scheduledEvents.toString());
        return this.scheduledEvents;
    }


    private boolean cacheIsStale(){
        return new Date().getTime() - this.lastUpdated.getTime() > CACHE_DURATION;
    }


    private void updateCache(){
        this.dataService.updateData();
        Instant now = Instant.now();
        this.scheduledEvents = this.dataService.getMappedEvents()
                .stream()
                .filter(event -> eventDateIsAfterNow(event, now))
                .toList();
    }

    private boolean eventDateIsAfterNow(NFLEvent event, Instant now) {
        Instant date = Instant.parse(event.getDate());


        return date.isAfter(now);

    }


}
