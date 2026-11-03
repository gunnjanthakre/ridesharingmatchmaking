package com.example.ridesharing.dto;

import com.example.ridesharing.model.Match;
import com.example.ridesharing.model.MatchStatus;

public class MatchResponse {

    private Long matchId;
    private Long tripId;
    private Long driverId;
    private String driverName;
    private Long rideRequestId;
    private double overlapPercentage;
    private double detourDistance;
    private int timeCompatibility;
    private double score;
    private MatchStatus status;

    public static MatchResponse from(Match match) {
        MatchResponse response = new MatchResponse();
        response.matchId = match.getId();
        response.tripId = match.getTrip().getId();
        response.driverId = match.getTrip().getDriver().getId();
        response.driverName = match.getTrip().getDriver().getName();
        response.rideRequestId = match.getRideRequest().getId();
        response.overlapPercentage = match.getOverlapPercentage();
        response.detourDistance = match.getDetourDistance();
        response.timeCompatibility = match.getTimeCompatibility();
        response.score = match.getScore();
        response.status = match.getStatus();
        return response;
    }

    public Long getMatchId() {
        return matchId;
    }

    public Long getTripId() {
        return tripId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public Long getRideRequestId() {
        return rideRequestId;
    }

    public double getOverlapPercentage() {
        return overlapPercentage;
    }

    public double getDetourDistance() {
        return detourDistance;
    }

    public int getTimeCompatibility() {
        return timeCompatibility;
    }

    public double getScore() {
        return score;
    }

    public MatchStatus getStatus() {
        return status;
    }
}
