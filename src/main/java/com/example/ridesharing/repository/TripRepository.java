package com.example.ridesharing.repository;

import com.example.ridesharing.model.Trip;
import com.example.ridesharing.model.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByStatus(TripStatus status);
    List<Trip> findByDriverId(Long driverId);
}
