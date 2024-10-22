package com.football.backend.services;

import com.football.backend.models.NFLEvent;
import com.football.backend.repositories.NFLEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;


@Service
public class ScheduleCacheManager {

    private static final Logger log = LoggerFactory.getLogger(ScheduleCacheManager.class);

    private Date lastUpdated;
    private List<NFLEvent> scheduledEvents;
    private final NFLEventRepository nflEventRepo;
    private final Sort sortStrategy;

    @Value("${cache.duration}")
    private long CACHE_DURATION;


    @Autowired
    public ScheduleCacheManager(NFLEventRepository eventRepo) {
        this.lastUpdated = new Date();
        this.nflEventRepo = eventRepo;
        this.sortStrategy = Sort.unsorted();
    }


    public List<NFLEvent> getScheduledEvents(){
        if (new Date().getTime() - this.lastUpdated.getTime() > CACHE_DURATION) {
            this.updateCache();
        }
        return this.scheduledEvents;
    }


    private void updateCache(){

    }


}
