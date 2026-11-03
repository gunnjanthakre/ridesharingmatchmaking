package com.example.ridesharing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> validationErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            validationErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        HttpStatus status = HttpStatus.BAD_REQUEST;
        ApiErrorResponse body = new ApiErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            "Request validation failed",
            validationErrors
        );
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        ApiErrorResponse body = new ApiErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            ex.getReason(),
            null
        );
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        ApiErrorResponse body = new ApiErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            "Unexpected server error",
            null
        );
        return ResponseEntity.status(status).body(body);
    }
}
