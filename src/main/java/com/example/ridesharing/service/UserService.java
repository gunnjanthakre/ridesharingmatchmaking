package com.example.ridesharing.service;

import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(String name, String email, String phone, double lat, double lng) {
        if (userRepository.findByEmail(email) != null) {
            throw new ResponseStatusException(CONFLICT, "User already registered with email: " + email);
        }
        User user = new User(name, email, phone, lat, lng);
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found: " + userId));
    }
}
