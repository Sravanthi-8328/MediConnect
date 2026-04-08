package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.Role;
import com.mediconnect.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByEmailIgnoreCaseAndRole(String email, Role role);
    List<User> findByRole(Role role);
}
