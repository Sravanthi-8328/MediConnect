package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.AuthResponse;
import com.mediconnect.backend.dto.LoginRequest;
import com.mediconnect.backend.dto.RegisterRequest;
import com.mediconnect.backend.model.Role;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest request) {
        Role role = parseRole(request.getRole());
        User user = userRepository.findByEmailIgnoreCaseAndRole(request.getEmail(), role).orElse(null);

        if (user != null && !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            user = null;
        }

        if (user == null) {
            AuthResponse response = new AuthResponse(false, "Invalid credentials or role");
            return response;
        }

        AuthResponse response = new AuthResponse(true, "Login successful");
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        return response;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            return new AuthResponse(false, "Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase(Locale.ROOT));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(parseRole(request.getRole()));
        user.setPhone(request.getPhone());
        user.setBlocked(false);

        User saved = userRepository.save(user);

        AuthResponse response = new AuthResponse(true, "Account created successfully");
        response.setUserId(saved.getId());
        response.setName(saved.getName());
        response.setEmail(saved.getEmail());
        response.setRole(saved.getRole().name());
        return response;
    }

    private Role parseRole(String role) {
        return Role.valueOf(role.trim().toUpperCase(Locale.ROOT));
    }
}
