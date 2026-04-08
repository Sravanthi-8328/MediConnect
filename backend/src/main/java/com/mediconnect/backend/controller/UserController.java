package com.mediconnect.backend.controller;

import com.mediconnect.backend.model.Role;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getUsers(@RequestParam(required = false) String role) {
        List<User> users = role == null || role.isBlank()
                ? userRepository.findAll()
                : userRepository.findByRole(Role.valueOf(role.toUpperCase()));

        return users.stream().map(this::sanitize).toList();
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return sanitize(user);
    }

    private Map<String, Object> sanitize(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "blocked", user.isBlocked()
        );
    }
}
