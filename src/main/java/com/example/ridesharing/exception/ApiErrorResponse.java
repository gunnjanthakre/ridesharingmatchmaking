package com.example.ridesharing.exception;

import java.time.LocalDateTime;
import java.util.Map;

public class ApiErrorResponse {
    private final LocalDateTime timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final Map<String, String> validationErrors;

    public ApiErrorResponse(int status, String error, String message, Map<String, String> validationErrors) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.validationErrors = validationErrors;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, String> getValidationErrors() {
        return validationErrors;
    }
}
