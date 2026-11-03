package com.example.ridesharing.controller;

import com.example.ridesharing.dto.CreateTripRequest;
import com.example.ridesharing.dto.DriverRegistrationRequest;
import com.example.ridesharing.model.Driver;
import com.example.ridesharing.model.Trip;
import com.example.ridesharing.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@Tag(name = "Drivers", description = "Driver registration and trip management APIs")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @PostMapping("/register")
    @Operation(summary = "Register a driver")
    public Driver register(@Valid @RequestBody DriverRegistrationRequest request) {
        return driverService.registerDriver(
            request.getName(),
            request.getEmail(),
            request.getPhone(),
            request.getLat(),
            request.getLng(),
            request.getSeats()
        );
    }

    @PostMapping("/addTrip")
    @Operation(summary = "Create a driver trip")
    public Trip addTrip(@Valid @RequestBody CreateTripRequest request) {
        return driverService.addTrip(
            request.getDriverId(),
            request.getStartLoc(),
            request.getEndLoc(),
            request.getStartLat(),
            request.getStartLng(),
            request.getEndLat(),
            request.getEndLng(),
            request.getStartTime(),
            request.getEndTime(),
            request.getSeats()
        );
    }

    @GetMapping("/{driverId}")
    @Operation(summary = "Get driver details")
    public Driver getDriver(@PathVariable Long driverId) {
        return driverService.getDriver(driverId);
    }

    @GetMapping("/{driverId}/trips")
    @Operation(summary = "List trips for a driver")
    public List<Trip> getTrips(@PathVariable Long driverId) {
        return driverService.getTripsForDriver(driverId);
    }
}
