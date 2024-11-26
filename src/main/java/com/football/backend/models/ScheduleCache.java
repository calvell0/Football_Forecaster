package com.football.backend.models;

import com.football.backend.config.CacheProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * This class caches all future NFL Events. Don't use this class directly, use ScheduleCacheManager instead.
 */
@Service
public class ScheduleCache {
    private final long CACHE_DURATION;

    private List<NFLEvent> scheduledEvents;
    private Date lastUpdated;

    @Autowired
    public ScheduleCache(CacheProperties cacheProperties){
        this.CACHE_DURATION = cacheProperties.getDuration();

    }


    /**
     * Check if cache is out-of-date
     * @return
     */
    public boolean isStale(){
        return this.lastUpdated == null || (new Date().getTime() - this.lastUpdated.getTime() > CACHE_DURATION);
    }

    /**
     * Set cached data and update lastUpdated
     * @param events
     */
    public void setCache(List<NFLEvent> events){
        this.scheduledEvents = events;
        this.lastUpdated = new Date();
    }

    public List<NFLEvent> getScheduledEvents(){
        return this.scheduledEvents;
    }



}
