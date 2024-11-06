package com.football.backend.models;

public enum EventStatus {
    SCHEDULED("STATUS_SCHEDULED"),
    FINAL("STATUS_FINAL"),
    OTHER("STATUS_OTHER");

    private final String statusString;

    EventStatus(String status) {
        this.statusString = status;
    }

    /**
     * Get a new EventStatus from a string
     * @param status "STATUS_SCHEDULED", "STATUS_FINAL", or "STATUS_OTHER"
     * @return the corresponding EventStatus
     **/
    public static EventStatus fromString(String status){
        for (EventStatus s : EventStatus.values()){
            if (s.statusString.equals(status)){
                return s;
            }
        }
        return OTHER;
    }

    @Override
    public String toString(){
        return this.statusString;
    }


}
