package com.example.ridesharing.model;

import jakarta.persistence.*;

@Entity
@Table(name = "matches")
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne
    @JoinColumn(name = "ride_request_id")
    private RideRequest rideRequest;

    private double overlapPercentage;
    private double detourDistance;
    private int timeCompatibility; // 0-100
    private double score;
    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    // Constructors, getters, setters
    public Match() {}

    public Match(Trip trip, RideRequest rideRequest, double overlapPercentage, double detourDistance, int timeCompatibility, double score) {
        this.trip = trip;
        this.rideRequest = rideRequest;
        this.overlapPercentage = overlapPercentage;
        this.detourDistance = detourDistance;
        this.timeCompatibility = timeCompatibility;
        this.score = score;
        this.status = MatchStatus.SUGGESTED;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public RideRequest getRideRequest() { return rideRequest; }
    public void setRideRequest(RideRequest rideRequest) { this.rideRequest = rideRequest; }
    public double getOverlapPercentage() { return overlapPercentage; }
    public void setOverlapPercentage(double overlapPercentage) { this.overlapPercentage = overlapPercentage; }
    public double getDetourDistance() { return detourDistance; }
    public void setDetourDistance(double detourDistance) { this.detourDistance = detourDistance; }
    public int getTimeCompatibility() { return timeCompatibility; }
    public void setTimeCompatibility(int timeCompatibility) { this.timeCompatibility = timeCompatibility; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    public MatchStatus getStatus() { return status; }
    public void setStatus(MatchStatus status) { this.status = status; }
}
