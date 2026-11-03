package com.example.ridesharing.dto;

import jakarta.validation.constraints.NotNull;

public class BookRideRequest {

    @NotNull
    private Long matchId;

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }
}
