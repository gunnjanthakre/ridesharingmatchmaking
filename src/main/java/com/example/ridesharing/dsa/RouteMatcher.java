package com.example.ridesharing.dsa;

import java.util.*;

public class RouteMatcher {

    public double calculateOverlap(List<String> driverRoute, List<String> riderRoute) {
        if (!isSubRoute(driverRoute, riderRoute)) {
            return 0.0;
        }
        return (double) riderRoute.size() / riderRoute.size();
    }

    public Set<String> findCommonStops(List<String> route1, List<String> route2) {
        Set<String> common = new LinkedHashSet<>();
        for (String stop1 : route1) {
            for (String stop2 : route2) {
                if (Objects.equals(stop1, stop2)) {
                    common.add(stop1);
                }
            }
        }
        return common;
    }

    public boolean hasOverlap(List<String> route1, List<String> route2) {
        return isSubRoute(route1, route2);
    }

    public boolean isSubRoute(List<String> driverRoute, List<String> riderRoute) {
        return findSubRouteStartIndex(driverRoute, riderRoute) >= 0;
    }

    public List<String> findMatchedSegment(List<String> driverRoute, List<String> riderRoute) {
        int startIndex = findSubRouteStartIndex(driverRoute, riderRoute);
        if (startIndex < 0) {
            return Collections.emptyList();
        }
        return new ArrayList<>(driverRoute.subList(startIndex, startIndex + riderRoute.size()));
    }

    private int findSubRouteStartIndex(List<String> driverRoute, List<String> riderRoute) {
        if (driverRoute == null || riderRoute == null || driverRoute.isEmpty() || riderRoute.isEmpty()) {
            return -1;
        }

        if (riderRoute.size() < 2 || driverRoute.size() < riderRoute.size()) {
            return -1;
        }

        for (int driverIndex = 0; driverIndex <= driverRoute.size() - riderRoute.size(); driverIndex++) {
            boolean matches = true;
            for (int riderIndex = 0; riderIndex < riderRoute.size(); riderIndex++) {
                if (!Objects.equals(driverRoute.get(driverIndex + riderIndex), riderRoute.get(riderIndex))) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                return driverIndex;
            }
        }

        return -1;
    }
}
