package com.football.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ScheduleInitializer implements CommandLineRunner {

    private final ScheduleCacheManager scheduleCacheManager;

    @Autowired
    public ScheduleInitializer(ScheduleCacheManager scheduleCacheManager){

        this.scheduleCacheManager = scheduleCacheManager;
    }

    /**
     * initialize cache of scheduled games at startup
     * @param args
     * @throws Exception
     */
    @Override
    public void run(String... args) throws Exception {
        scheduleCacheManager.initCache();
    }


}
