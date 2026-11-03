package com.example.ridesharing.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public class CreateTripRequest {

    @NotNull
    private Long driverId;

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
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @NotNull
    @Positive
    private Integer seats;

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
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

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }
}
