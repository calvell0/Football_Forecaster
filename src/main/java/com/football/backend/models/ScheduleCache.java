package com.football.backend.models;

import com.football.backend.config.CacheProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ScheduleCache {
    private final long CACHE_DURATION;

    private List<NFLEvent> scheduledEvents;
    private Date lastUpdated;

    @Autowired
    public ScheduleCache(CacheProperties cacheProperties){
        this.CACHE_DURATION = cacheProperties.getDuration();

    }

    public boolean isStale(){
        return this.lastUpdated == null || (new Date().getTime() - this.lastUpdated.getTime() > CACHE_DURATION);
    }

    public void setCache(List<NFLEvent> events){
        this.scheduledEvents = events;
        this.lastUpdated = new Date();
    }

    public List<NFLEvent> getScheduledEvents(){
        return this.scheduledEvents;
    }



}
