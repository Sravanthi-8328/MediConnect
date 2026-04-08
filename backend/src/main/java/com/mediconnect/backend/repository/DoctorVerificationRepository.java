package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.DoctorVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DoctorVerificationRepository extends JpaRepository<DoctorVerification, Long> {
    Optional<DoctorVerification> findByDoctorId(Long doctorId);
}
