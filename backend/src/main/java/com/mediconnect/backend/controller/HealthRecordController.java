package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.HealthRecordCreateRequest;
import com.mediconnect.backend.model.HealthRecord;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.HealthRecordRepository;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/health-records")
public class HealthRecordController {

    private final HealthRecordRepository healthRecordRepository;
    private final UserRepository userRepository;

    public HealthRecordController(HealthRecordRepository healthRecordRepository, UserRepository userRepository) {
        this.healthRecordRepository = healthRecordRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/patient/{patientId}")
    public List<HealthRecord> byPatient(@PathVariable Long patientId) {
        return healthRecordRepository.findByPatientIdOrderByDateDesc(patientId);
    }

    @PostMapping
    public HealthRecord create(@RequestBody HealthRecordCreateRequest request) {
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        HealthRecord record = new HealthRecord();
        record.setId(null);
        record.setPatient(patient);
        record.setType(request.getType());
        record.setTitle(request.getTitle());
        record.setDescription(request.getDescription());
        record.setDate(LocalDate.parse(request.getDate()));
        record.setDoctor(request.getDoctor());
        return healthRecordRepository.save(record);
    }
}
