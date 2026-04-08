package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {
    List<HealthRecord> findByPatientIdOrderByDateDesc(Long patientId);
}
