package com.example.ridesharing.dsa;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteMatcherTest {

    private final RouteMatcher routeMatcher = new RouteMatcher();

    @Test
    void calculateOverlapReturnsFullMatchForContinuousSubRoute() {
        double overlap = routeMatcher.calculateOverlap(
            List.of("A", "B", "C", "D"),
            List.of("B", "C")
        );

        assertEquals(1.0, overlap);
    }

    @Test
    void hasOverlapReturnsTrueWhenRoutesShareAnyStop() {
        assertTrue(routeMatcher.hasOverlap(
            List.of("A", "B", "C", "D"),
            List.of("A", "B")
        ));
    }

    @Test
    void calculateOverlapReturnsFullScoreWhenRiderRouteIsSubRoute() {
        double overlap = routeMatcher.calculateOverlap(
            List.of("A", "B", "C", "D"),
            List.of("B", "C")
        );

        assertEquals(1.0, overlap);
    }

    @Test
    void hasOverlapReturnsFalseWhenRouteIsNotContiguousSubroute() {
        assertFalse(routeMatcher.hasOverlap(
            List.of("A", "B", "C", "D"),
            List.of("A", "D")
        ));
    }

    @Test
    void hasOverlapReturnsFalseWhenRoutesOnlyShareSingleStop() {
        assertFalse(routeMatcher.hasOverlap(
            List.of("A", "D", "F"),
            List.of("X", "D", "Y")
        ));
    }
}
