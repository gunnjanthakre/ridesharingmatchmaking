package com.example.ridesharing.dsa;

import java.time.LocalDateTime;
import java.util.*;

public class TimeMatcher {

    // Greedy algorithm for time compatibility
    public int calculateTimeCompatibility(LocalDateTime driverStart, LocalDateTime driverEnd, LocalDateTime riderRequest) {
        if (riderRequest.isBefore(driverStart) || riderRequest.isAfter(driverEnd)) {
            return 0; // no overlap
        }
        // Simple score based on how close to start
        long totalMinutes = java.time.Duration.between(driverStart, driverEnd).toMinutes();
        long waitMinutes = java.time.Duration.between(driverStart, riderRequest).toMinutes();
        if (totalMinutes == 0) return 100;
        return (int) ((1 - (double) waitMinutes / totalMinutes) * 100);
    }

    // Interval Scheduling - but for matching, perhaps check if intervals overlap
    public boolean intervalsOverlap(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}