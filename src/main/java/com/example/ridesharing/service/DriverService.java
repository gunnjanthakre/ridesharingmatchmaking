package com.example.ridesharing.service;

import com.example.ridesharing.model.Driver;
import com.example.ridesharing.model.Trip;
import com.example.ridesharing.repository.DriverRepository;
import com.example.ridesharing.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private TripRepository tripRepository;

    public Driver registerDriver(String name, String email, String phone, double lat, double lng, int seats) {
        if (driverRepository.findByEmail(email) != null) {
            throw new ResponseStatusException(CONFLICT, "Driver already registered with email: " + email);
        }
        Driver driver = new Driver(name, email, phone, lat, lng, seats);
        return driverRepository.save(driver);
    }

    public Trip addTrip(Long driverId, String startLoc, String endLoc, double startLat, double startLng, double endLat, double endLng, LocalDateTime startTime, LocalDateTime endTime, int seats) {
        Driver driver = driverRepository.findById(driverId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Driver not found: " + driverId));
        if (seats <= 0 || startTime.isAfter(endTime)) {
            throw new ResponseStatusException(BAD_REQUEST, "Trip payload is invalid");
        }
        Trip trip = new Trip(driver, startLoc, endLoc, startLat, startLng, endLat, endLng, startTime, endTime, seats);
        return tripRepository.save(trip);
    }

    public Driver getDriver(Long driverId) {
        return driverRepository.findById(driverId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Driver not found: " + driverId));
    }

    public List<Trip> getTripsForDriver(Long driverId) {
        getDriver(driverId);
        return tripRepository.findByDriverId(driverId);
    }
}
