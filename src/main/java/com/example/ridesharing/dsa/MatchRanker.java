package com.example.ridesharing.dsa;

import java.util.PriorityQueue;
import java.util.Comparator;

public class MatchRanker {

    public PriorityQueue<DriverMatch> rankDrivers() {
        // PriorityQueue with max heap (reverse order)
        return new PriorityQueue<>(Comparator.comparingDouble(DriverMatch::getScore).reversed());
    }

    public static class DriverMatch {
        private Long driverId;
        private double score; // based on overlap, detour, time

        public DriverMatch(Long driverId, double score) {
            this.driverId = driverId;
            this.score = score;
        }

        public Long getDriverId() { return driverId; }
        public double getScore() { return score; }
    }
}