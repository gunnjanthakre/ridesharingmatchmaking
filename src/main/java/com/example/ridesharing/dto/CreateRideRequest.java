package com.example.ridesharing.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public class CreateRideRequest {

    @NotNull
    private Long userId;

    @NotBlank
    private String startLoc;

    @NotBlank
    private String endLoc;

    @NotNull
    @Min(-90)
    @Max(90)
    private Double startLat;

    @NotNull
    @Min(-180)
    @Max(180)
    private Double startLng;

    @NotNull
    @Min(-90)
    @Max(90)
    private Double endLat;

    @NotNull
    @Min(-180)
    @Max(180)
    private Double endLng;

    @NotNull
    private LocalDateTime time;

    @NotNull
    @Positive
    private Integer seats;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getStartLoc() {
        return startLoc;
    }

    public void setStartLoc(String startLoc) {
        this.startLoc = startLoc;
    }

    public String getEndLoc() {
        return endLoc;
    }

    public void setEndLoc(String endLoc) {
        this.endLoc = endLoc;
    }

    public Double getStartLat() {
        return startLat;
    }

    public void setStartLat(Double startLat) {
        this.startLat = startLat;
    }

    public Double getStartLng() {
        return startLng;
    }

    public void setStartLng(Double startLng) {
        this.startLng = startLng;
    }

    public Double getEndLat() {
        return endLat;
    }

    public void setEndLat(Double endLat) {
        this.endLat = endLat;
    }

    public Double getEndLng() {
        return endLng;
    }

    public void setEndLng(Double endLng) {
        this.endLng = endLng;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }
}
