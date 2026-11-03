package com.example.ridesharing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "trips")
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;

    private String startLocation;
    private String endLocation;
    private double startLat;
    private double startLng;
    private double endLat;
    private double endLng;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int availableSeats;
    @Enumerated(EnumType.STRING)
    private TripStatus status;

    @JsonIgnore
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL)
    private List<Match> matches;

    // Constructors, getters, setters
    public Trip() {}

    public Trip(Driver driver, String startLocation, String endLocation, double startLat, double startLng, double endLat, double endLng, LocalDateTime startTime, LocalDateTime endTime, int availableSeats) {
        this.driver = driver;
        this.startLocation = startLocation;
        this.endLocation = endLocation;
        this.startLat = startLat;
        this.startLng = startLng;
        this.endLat = endLat;
        this.endLng = endLng;
        this.startTime = startTime;
        this.endTime = endTime;
        this.availableSeats = availableSeats;
        this.status = TripStatus.CREATED;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }
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
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }
    public TripStatus getStatus() { return status; }
    public void setStatus(TripStatus status) { this.status = status; }
    public List<Match> getMatches() { return matches; }
    public void setMatches(List<Match> matches) { this.matches = matches; }
}
