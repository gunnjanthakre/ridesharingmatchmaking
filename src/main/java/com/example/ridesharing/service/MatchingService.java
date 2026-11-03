package com.example.ridesharing.service;

import com.example.ridesharing.dsa.*;
import com.example.ridesharing.dto.MatchResponse;
import com.example.ridesharing.model.*;
import com.example.ridesharing.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class MatchingService {

    private static final int GRID_SIZE = 30;
    private static final double MAX_PICKUP_DISTANCE_KM = 15.0;
    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final TripRepository tripRepository;
    private final RideRequestRepository rideRequestRepository;
    private final MatchRepository matchRepository;
    private final RouteMatcher routeMatcher = new RouteMatcher();
    private final TimeMatcher timeMatcher = new TimeMatcher();
    private final Graph cityGraph = buildCityGraph();

    public MatchingService(
        TripRepository tripRepository,
        RideRequestRepository rideRequestRepository,
        MatchRepository matchRepository
    ) {
        this.tripRepository = tripRepository;
        this.rideRequestRepository = rideRequestRepository;
        this.matchRepository = matchRepository;
    }

    @Transactional
    public List<MatchResponse> findMatches(Long requestId) {
        RideRequest request = rideRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ride request not found: " + requestId));

        List<Trip> availableTrips = tripRepository.findByStatus(TripStatus.CREATED);
        List<Match> matches = new ArrayList<>();

        List<String> riderRoute = buildRoute(
            request.getStartLocation(),
            request.getEndLocation(),
            request.getStartLat(),
            request.getStartLng(),
            request.getEndLat(),
            request.getEndLng()
        );
        log.debug("Rider route for request {}: {}", requestId, riderRoute);

        if (riderRoute.isEmpty() || riderRoute.size() < 2) {
            log.debug("Rejecting request {} because rider route is empty or shorter than 2 nodes: {}", requestId, riderRoute);
            matchRepository.deleteByRideRequestIdAndStatus(requestId, MatchStatus.SUGGESTED);
            return List.of();
        }

        for (Trip trip : availableTrips) {
            if (trip.getAvailableSeats() < request.getRequiredSeats()) {
                log.debug(
                    "Rejecting trip {} for request {} because seats are insufficient. available={}, required={}",
                    trip.getId(),
                    requestId,
                    trip.getAvailableSeats(),
                    request.getRequiredSeats()
                );
                continue;
            }

            double pickupDistance = calculateDistanceKm(
                request.getStartLat(), request.getStartLng(),
                trip.getStartLat(), trip.getStartLng()
            );
            if (pickupDistance > MAX_PICKUP_DISTANCE_KM) {
                log.debug(
                    "Rejecting trip {} for request {} because pickup distance {} km exceeds {} km",
                    trip.getId(),
                    requestId,
                    pickupDistance,
                    MAX_PICKUP_DISTANCE_KM
                );
                continue;
            }

            List<String> driverRoute = buildRoute(
                trip.getStartLocation(),
                trip.getEndLocation(),
                trip.getStartLat(),
                trip.getStartLng(),
                trip.getEndLat(),
                trip.getEndLng()
            );
            log.debug("Driver route for trip {}: {}", trip.getId(), driverRoute);

            if (driverRoute.isEmpty() || driverRoute.size() < 2) {
                log.debug(
                    "Rejecting trip {} for request {} because driver route is empty or shorter than 2 nodes: {}",
                    trip.getId(),
                    requestId,
                    driverRoute
                );
                continue;
            }

            if (!routeMatcher.isSubRoute(driverRoute, riderRoute)) {
                log.debug(
                    "Rejecting trip {} for request {} because rider route is not a contiguous subroute of driver route",
                    trip.getId(),
                    requestId
                );
                continue;
            }

            List<String> matchedSegment = routeMatcher.findMatchedSegment(driverRoute, riderRoute);
            if (matchedSegment.size() < 2) {
                log.debug(
                    "Rejecting trip {} for request {} because matched segment is shorter than 2 nodes: {}",
                    trip.getId(),
                    requestId,
                    matchedSegment
                );
                continue;
            }

            double overlap = (double) matchedSegment.size() / riderRoute.size();
            log.debug(
                "Matched segment for trip {} and request {}: {} with overlap score {}",
                trip.getId(),
                requestId,
                matchedSegment,
                overlap
            );

            int timeCompat = timeMatcher.calculateTimeCompatibility(trip.getStartTime(), trip.getEndTime(), request.getRequestedTime());
            if (timeCompat == 0) {
                log.debug(
                    "Rejecting trip {} for request {} because requested time {} is outside driver window {} - {}",
                    trip.getId(),
                    requestId,
                    request.getRequestedTime(),
                    trip.getStartTime(),
                    trip.getEndTime()
                );
                continue;
            }

            double score = overlap * 0.5 + (timeCompat / 100.0) * 0.3 + (1.0 / (1 + pickupDistance)) * 0.2;

            Match match = new Match(trip, request, overlap, pickupDistance, timeCompat, score);
            matches.add(match);
        }

        matches.sort(Comparator.comparingDouble(Match::getScore).reversed());

        matchRepository.deleteByRideRequestIdAndStatus(requestId, MatchStatus.SUGGESTED);

        List<Match> topMatches = new ArrayList<>(matches.subList(0, Math.min(5, matches.size())));
        if (!topMatches.isEmpty()) {
            request.setStatus(RideRequestStatus.MATCHED);
            rideRequestRepository.save(request);
            matchRepository.saveAll(topMatches);
        }
        return topMatches.stream().map(MatchResponse::from).toList();
    }

    @Transactional
    public Match bookRide(Long matchId) {
        Match match = matchRepository.findById(matchId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Match not found: " + matchId));

        Trip trip = match.getTrip();
        RideRequest request = match.getRideRequest();

        if (trip.getAvailableSeats() < request.getRequiredSeats()) {
            throw new ResponseStatusException(BAD_REQUEST, "Seats are no longer available for this trip");
        }

        trip.setAvailableSeats(trip.getAvailableSeats() - request.getRequiredSeats());
        trip.setStatus(TripStatus.MATCHED);
        request.setStatus(RideRequestStatus.BOOKED);
        match.setStatus(MatchStatus.ACCEPTED);

        tripRepository.save(trip);
        rideRequestRepository.save(request);
        return matchRepository.save(match);
    }

    public List<MatchResponse> getMatchesForRequest(Long requestId) {
        rideRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Ride request not found: " + requestId));

        return matchRepository.findByRideRequestIdOrderByScoreDesc(requestId)
            .stream()
            .map(MatchResponse::from)
            .toList();
    }

    private double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2) {
        final int earthRadiusKm = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private List<String> buildRoute(
        String startLocation,
        String endLocation,
        double startLat,
        double startLng,
        double endLat,
        double endLng
    ) {
        if (isNormalizedGridCoordinate(startLat, startLng, endLat, endLng)) {
            List<String> route = cityGraph.getShortestPath(
                toNodeKey(startLat, startLng),
                toNodeKey(endLat, endLng)
            );
            if (!route.isEmpty()) {
                return route;
            }
        }

        if (Objects.equals(startLocation, endLocation)) {
            return List.of(startLocation);
        }
        return Arrays.asList(startLocation, endLocation);
    }

    private boolean isNormalizedGridCoordinate(double startLat, double startLng, double endLat, double endLng) {
        return isUnitCoordinate(startLat)
            && isUnitCoordinate(startLng)
            && isUnitCoordinate(endLat)
            && isUnitCoordinate(endLng);
    }

    private boolean isUnitCoordinate(double value) {
        return value >= 0.0 && value <= 1.0;
    }

    private String toNodeKey(double lat, double lng) {
        int x = toGridCoordinate(lat);
        int y = toGridCoordinate(lng);
        int nodeId = y * GRID_SIZE + x;
        return String.format("%03d", nodeId);
    }

    private int toGridCoordinate(double value) {
        int coordinate = (int) Math.round(value * GRID_SIZE);
        return Math.max(0, Math.min(GRID_SIZE - 1, coordinate));
    }

    private Graph buildCityGraph() {
        Graph graph = new Graph();

        for (int y = 0; y < GRID_SIZE; y++) {
            for (int x = 0; x < GRID_SIZE; x++) {
                graph.addNode(nodeKeyFor(x, y));
            }
        }

        for (int y = 0; y < GRID_SIZE; y++) {
            for (int x = 0; x < GRID_SIZE; x++) {
                if (x < GRID_SIZE - 1) {
                    graph.addEdge(nodeKeyFor(x, y), nodeKeyFor(x + 1, y), 1.0);
                }
                if (y < GRID_SIZE - 1) {
                    graph.addEdge(nodeKeyFor(x, y), nodeKeyFor(x, y + 1), 1.0);
                }
            }
        }

        return graph;
    }

    private String nodeKeyFor(int x, int y) {
        int nodeId = y * GRID_SIZE + x;
        return String.format("%03d", nodeId);
    }
}
