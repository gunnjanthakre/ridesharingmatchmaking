package com.example.ridesharing.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ride_requests")
public class RideRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String startLocation;
    private String endLocation;
    private double startLat;
    private double startLng;
    private double endLat;
    private double endLng;
    private LocalDateTime requestedTime;
    private int requiredSeats;
    @Enumerated(EnumType.STRING)
    private RideRequestStatus status;

    // Constructors, getters, setters
    public RideRequest() {}

    public RideRequest(User user, String startLocation, String endLocation, double startLat, double startLng, double endLat, double endLng, LocalDateTime requestedTime, int requiredSeats) {
        this.user = user;
        this.startLocation = startLocation;
        this.endLocation = endLocation;
        this.startLat = startLat;
        this.startLng = startLng;
        this.endLat = endLat;
        this.endLng = endLng;
        this.requestedTime = requestedTime;
        this.requiredSeats = requiredSeats;
        this.status = RideRequestStatus.PENDING;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getStartLocation() { return startLocation; }
    public void setStartLocation(String startLocation) { this.startLocation = startLocation; }
    public String getEndLocation() { return endLocation; }
    public void setEndLocation(String endLocation) { this.endLocation = endLocation; }
    public double getStartLat() { return startLat; }
    public void setStartLat(double startLat) { this.startLat = startLat; }
    public double getStartLng() { return startLng; }
    public void setStartLng(double startLng) { this.startLng = startLng; }
    public double getEndLat() { return endLat; }
    public void setEndLat(double endLat) { this.endLat = endLat; }
    public double getEndLng() { return endLng; }
    public void setEndLng(double endLng) { this.endLng = endLng; }
    public LocalDateTime getRequestedTime() { return requestedTime; }
    public void setRequestedTime(LocalDateTime requestedTime) { this.requestedTime = requestedTime; }
    public int getRequiredSeats() { return requiredSeats; }
    public void setRequiredSeats(int requiredSeats) { this.requiredSeats = requiredSeats; }
    public RideRequestStatus getStatus() { return status; }
    public void setStatus(RideRequestStatus status) { this.status = status; }
}
