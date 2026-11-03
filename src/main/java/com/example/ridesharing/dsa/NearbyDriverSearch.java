package com.example.ridesharing.dsa;

import com.example.ridesharing.model.Driver;

import java.util.*;

public class NearbyDriverSearch {

    // Simple grid-based search (divide into grid cells)
    private Map<String, List<DriverLocation>> grid = new HashMap<>();

    public void addDriver(Long driverId, double lat, double lng) {
        String cell = getGridCell(lat, lng);
        grid.putIfAbsent(cell, new ArrayList<>());
        grid.get(cell).add(new DriverLocation(driverId, lat, lng));
    }

    public List<Long> findNearbyDrivers(double lat, double lng, double radiusKm) {
        List<Long> nearby = new ArrayList<>();
        String cell = getGridCell(lat, lng);
        // Check current cell and adjacent cells
        List<String> cellsToCheck = new ArrayList<>();
        cellsToCheck.add(cell);
        cellsToCheck.addAll(getAdjacentCells(cell));
        for (String c : cellsToCheck) {
            if (grid.containsKey(c)) {
                for (DriverLocation dl : grid.get(c)) {
                    if (calculateDistance(lat, lng, dl.lat, dl.lng) <= radiusKm) {
                        nearby.add(dl.driverId);
                    }
                }
            }
        }
        return nearby;
    }

    public List<Long> findNearbyDrivers(double lat, double lng, double radiusKm, List<Driver> drivers) {
        grid.clear();
        for (Driver driver : drivers) {
            addDriver(driver.getId(), driver.getLatitude(), driver.getLongitude());
        }
        return findNearbyDrivers(lat, lng, radiusKm);
    }

    private String getGridCell(double lat, double lng) {
        // Simple grid: 1 degree ~ 111 km
        int latCell = (int) Math.floor(lat);
        int lngCell = (int) Math.floor(lng);
        return latCell + "," + lngCell;
    }

    private List<String> getAdjacentCells(String cell) {
        String[] parts = cell.split(",");
        int lat = Integer.parseInt(parts[0]);
        int lng = Integer.parseInt(parts[1]);
        List<String> adjacent = new ArrayList<>();
        for (int dl = -1; dl <= 1; dl++) {
            for (int dlng = -1; dlng <= 1; dlng++) {
                if (dl == 0 && dlng == 0) continue;
                adjacent.add((lat + dl) + "," + (lng + dlng));
            }
        }
        return adjacent;
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        // Haversine formula
        final int R = 6371; // Radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static class DriverLocation {
        Long driverId;
        double lat, lng;

        DriverLocation(Long driverId, double lat, double lng) {
            this.driverId = driverId;
            this.lat = lat;
            this.lng = lng;
        }
    }
}
