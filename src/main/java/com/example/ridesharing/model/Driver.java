package com.example.ridesharing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "drivers")
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private double latitude;
    private double longitude;
    private int availableSeats;

    @JsonIgnore
    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL)
    private List<Trip> trips;

    // Constructors, getters, setters
    public Driver() {}

    public Driver(String name, String email, String phone, double latitude, double longitude, int availableSeats) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.latitude = latitude;
        this.longitude = longitude;
        this.availableSeats = availableSeats;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }
    public List<Trip> getTrips() { return trips; }
    public void setTrips(List<Trip> trips) { this.trips = trips; }
}
