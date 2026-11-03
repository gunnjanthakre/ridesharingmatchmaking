package com.example.ridesharing.controller;

import com.example.ridesharing.dto.BookRideRequest;
import com.example.ridesharing.dto.CreateRideRequest;
import com.example.ridesharing.dto.MatchResponse;
import com.example.ridesharing.model.Match;
import com.example.ridesharing.model.RideRequest;
import com.example.ridesharing.service.MatchingService;
import com.example.ridesharing.service.RideRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
@Tag(name = "Rides", description = "Ride request, matchmaking, and booking APIs")
public class RideController {

    @Autowired
    private RideRequestService rideRequestService;

    @Autowired
    private MatchingService matchingService;

    @PostMapping("/request")
    @Operation(summary = "Create a ride request")
    public RideRequest requestRide(@Valid @RequestBody CreateRideRequest request) {
        return rideRequestService.createRequest(
            request.getUserId(),
            request.getStartLoc(),
            request.getEndLoc(),
            request.getStartLat(),
            request.getStartLng(),
            request.getEndLat(),
            request.getEndLng(),
            request.getTime(),
            request.getSeats()
        );
    }

    @GetMapping("/findRides")
    @Operation(summary = "Run the matchmaking engine for a ride request")
    public List<MatchResponse> findRides(@RequestParam Long requestId) {
        return matchingService.findMatches(requestId);
    }

    @PostMapping("/bookRide")
    @Operation(summary = "Book a suggested match")
    public Match bookRide(@Valid @RequestBody BookRideRequest request) {
        return matchingService.bookRide(request.getMatchId());
    }

    @GetMapping("/requests/{requestId}")
    @Operation(summary = "Get ride request details")
    public RideRequest getRequest(@PathVariable Long requestId) {
        return rideRequestService.getRequest(requestId);
    }

    @GetMapping("/requests/{requestId}/matches")
    @Operation(summary = "List stored matches for a ride request")
    public List<MatchResponse> getMatches(@PathVariable Long requestId) {
        return matchingService.getMatchesForRequest(requestId);
    }
}
