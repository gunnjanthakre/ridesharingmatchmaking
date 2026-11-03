package com.example.ridesharing.service;

import com.example.ridesharing.model.RideRequest;
import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.RideRequestRepository;
import com.example.ridesharing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class RideRequestService {

    @Autowired
    private RideRequestRepository rideRequestRepository;

    @Autowired
    private UserRepository userRepository;

    public RideRequest createRequest(Long userId, String startLoc, String endLoc, double startLat, double startLng, double endLat, double endLng, LocalDateTime time, int seats) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found: " + userId));
        if (seats <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Requested seats must be greater than zero");
        }
        RideRequest request = new RideRequest(user, startLoc, endLoc, startLat, startLng, endLat, endLng, time, seats);
        return rideRequestRepository.save(request);
    }

    public RideRequest getRequest(Long requestId) {
        return rideRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ride request not found: " + requestId));
    }

    public List<RideRequest> getPendingRequests() {
        return rideRequestRepository.findByStatus(com.example.ridesharing.model.RideRequestStatus.PENDING);
    }
}
