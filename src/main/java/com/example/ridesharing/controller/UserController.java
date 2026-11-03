package com.example.ridesharing.controller;

import com.example.ridesharing.dto.UserRegistrationRequest;
import com.example.ridesharing.model.User;
import com.example.ridesharing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "User registration and lookup APIs")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    @Operation(summary = "Register a rider")
    public User register(@Valid @RequestBody UserRegistrationRequest request) {
        return userService.registerUser(
            request.getName(),
            request.getEmail(),
            request.getPhone(),
            request.getLat(),
            request.getLng()
        );
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user details")
    public User getUser(@PathVariable Long userId) {
        return userService.getUser(userId);
    }
}
