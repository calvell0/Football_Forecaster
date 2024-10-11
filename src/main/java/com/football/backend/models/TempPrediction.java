package com.football.backend.models;

public class TempPrediction {

    public TempPrediction(boolean outcome, double confidence) {
        this.outcome = outcome;
        this.confidence = confidence;
    }

    private boolean outcome;
    private double confidence;

    public boolean getOutcome() {
        return outcome;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setOutcome(boolean outcome) {
        this.outcome = outcome;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }
}
