package com.example.ridesharing.service;

import com.example.ridesharing.dto.MatchResponse;
import com.example.ridesharing.model.Driver;
import com.example.ridesharing.model.Match;
import com.example.ridesharing.model.MatchStatus;
import com.example.ridesharing.model.RideRequest;
import com.example.ridesharing.model.RideRequestStatus;
import com.example.ridesharing.model.Trip;
import com.example.ridesharing.model.TripStatus;
import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.MatchRepository;
import com.example.ridesharing.repository.RideRequestRepository;
import com.example.ridesharing.repository.TripRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private RideRequestRepository rideRequestRepository;

    @Mock
    private MatchRepository matchRepository;

    @InjectMocks
    private MatchingService matchingService;

    @Test
    void findMatchesReturnsBestNearbyTripAndMarksRequestMatched() {
        User rider = new User("Rider", "rider@example.com", "9999999999", 12.9716, 77.5946);
        RideRequest request = new RideRequest(
            rider, "B", "C", 12.9716, 77.5946, 12.9352, 77.6245,
            LocalDateTime.of(2026, 4, 21, 10, 30), 1
        );
        request.setId(10L);

        Driver nearbyDriver = new Driver("Driver 1", "d1@example.com", "8888888888", 12.9720, 77.5950, 3);
        nearbyDriver.setId(1L);
        Trip matchingTrip = new Trip(
            nearbyDriver, "B", "C", 12.9720, 77.5950, 12.9350, 77.6240,
            LocalDateTime.of(2026, 4, 21, 10, 0),
            LocalDateTime.of(2026, 4, 21, 11, 0),
            2
        );

        Driver farDriver = new Driver("Driver 2", "d2@example.com", "7777777777", 28.6139, 77.2090, 3);
        farDriver.setId(2L);
        Trip farTrip = new Trip(
            farDriver, "B", "C", 28.6139, 77.2090, 28.7041, 77.1025,
            LocalDateTime.of(2026, 4, 21, 10, 0),
            LocalDateTime.of(2026, 4, 21, 11, 0),
            2
        );

        when(rideRequestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(tripRepository.findByStatus(TripStatus.CREATED)).thenReturn(List.of(matchingTrip, farTrip));

        List<MatchResponse> matches = matchingService.findMatches(10L);

        assertEquals(1, matches.size());
        assertEquals(matchingTrip.getDriver().getId(), matches.get(0).getDriverId());
        assertEquals(request.getId(), matches.get(0).getRideRequestId());
        assertEquals(RideRequestStatus.MATCHED, request.getStatus());
        verify(matchRepository).deleteByRideRequestIdAndStatus(10L, MatchStatus.SUGGESTED);
        verify(matchRepository).saveAll(any());
        verify(rideRequestRepository).save(request);
    }

    @Test
    void findMatchesReturnsPartialRouteMatchWhenDriverOnlyCoversPartOfRide() {
        User rider = new User("Rider", "rider@example.com", "9999999999", 0.0, 0.0);
        RideRequest request = new RideRequest(
            rider, "Origin", "Midpoint", 0.0, 0.0, 0.0666666667, 0.0,
            LocalDateTime.of(2026, 4, 21, 10, 30), 1
        );
        request.setId(25L);

        Driver driver = new Driver("Driver 1", "d1@example.com", "8888888888", 0.0, 0.0, 3);
        driver.setId(1L);
        Trip partialTrip = new Trip(
            driver, "Origin", "Destination", 0.0, 0.0, 0.1, 0.0,
            LocalDateTime.of(2026, 4, 21, 10, 0),
            LocalDateTime.of(2026, 4, 21, 11, 0),
            2
        );

        when(rideRequestRepository.findById(25L)).thenReturn(Optional.of(request));
        when(tripRepository.findByStatus(TripStatus.CREATED)).thenReturn(List.of(partialTrip));

        List<MatchResponse> matches = matchingService.findMatches(25L);

        assertEquals(1, matches.size());
        assertEquals(1.0, matches.get(0).getOverlapPercentage());
        assertEquals(driver.getId(), matches.get(0).getDriverId());
        assertEquals(RideRequestStatus.MATCHED, request.getStatus());
        verify(matchRepository).saveAll(any());
    }

    @Test
    void findMatchesRejectsRiderRouteThatIsNotContiguousSubroute() {
        User rider = new User("Rider", "rider@example.com", "9999999999", 0.0, 0.0);
        RideRequest request = new RideRequest(
            rider, "Origin", "Turn", 0.0, 0.0, 0.0666666667, 0.0333333333,
            LocalDateTime.of(2026, 4, 21, 10, 30), 1
        );
        request.setId(30L);

        Driver driver = new Driver("Driver 1", "d1@example.com", "8888888888", 0.0, 0.0, 3);
        driver.setId(1L);
        Trip trip = new Trip(
            driver, "Origin", "Straight", 0.0, 0.0, 0.1, 0.0,
            LocalDateTime.of(2026, 4, 21, 10, 0),
            LocalDateTime.of(2026, 4, 21, 11, 0),
            2
        );

        when(rideRequestRepository.findById(30L)).thenReturn(Optional.of(request));
        when(tripRepository.findByStatus(TripStatus.CREATED)).thenReturn(List.of(trip));

        List<MatchResponse> matches = matchingService.findMatches(30L);

        assertTrue(matches.isEmpty());
    }

    @Test
    void bookRideReducesSeatsAndAcceptsMatch() {
        User rider = new User("Rider", "rider@example.com", "9999999999", 12.9716, 77.5946);
        RideRequest request = new RideRequest(
            rider, "B", "C", 12.9716, 77.5946, 12.9352, 77.6245,
            LocalDateTime.of(2026, 4, 21, 10, 30), 1
        );

        Driver driver = new Driver("Driver 1", "d1@example.com", "8888888888", 12.9720, 77.5950, 3);
        Trip trip = new Trip(
            driver, "B", "C", 12.9720, 77.5950, 12.9350, 77.6240,
            LocalDateTime.of(2026, 4, 21, 10, 0),
            LocalDateTime.of(2026, 4, 21, 11, 0),
            2
        );

        Match match = new Match(trip, request, 1.0, 0.2, 80, 0.94);
        match.setId(15L);

        when(matchRepository.findById(15L)).thenReturn(Optional.of(match));
        when(matchRepository.save(any(Match.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Match booked = matchingService.bookRide(15L);

        assertSame(match, booked);
        assertEquals(1, trip.getAvailableSeats());
        assertEquals(TripStatus.MATCHED, trip.getStatus());
        assertEquals(RideRequestStatus.BOOKED, request.getStatus());
        assertEquals(MatchStatus.ACCEPTED, match.getStatus());

        ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
        verify(tripRepository).save(tripCaptor.capture());
        assertEquals(1, tripCaptor.getValue().getAvailableSeats());
    }
}
