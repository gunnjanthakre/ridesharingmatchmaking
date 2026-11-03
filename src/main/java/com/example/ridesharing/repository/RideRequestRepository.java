package com.example.ridesharing.repository;

import com.example.ridesharing.model.RideRequest;
import com.example.ridesharing.model.RideRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRequestRepository extends JpaRepository<RideRequest, Long> {
    List<RideRequest> findByStatus(RideRequestStatus status);
}
