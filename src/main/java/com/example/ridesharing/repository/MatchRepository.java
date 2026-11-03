package com.example.ridesharing.repository;

import com.example.ridesharing.model.Match;
import com.example.ridesharing.model.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByRideRequestIdAndStatus(Long rideRequestId, MatchStatus status);
    List<Match> findByRideRequestIdOrderByScoreDesc(Long rideRequestId);
    void deleteByRideRequestIdAndStatus(Long rideRequestId, MatchStatus status);
}
