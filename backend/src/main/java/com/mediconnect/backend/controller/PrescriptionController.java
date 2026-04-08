package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.PrescriptionRequest;
import com.mediconnect.backend.model.Prescription;
import com.mediconnect.backend.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @PostMapping
    public Prescription create(@Valid @RequestBody PrescriptionRequest request) {
        return prescriptionService.create(request);
    }

    @GetMapping
    public List<Prescription> all() {
        return prescriptionService.getAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Prescription> byPatient(@PathVariable Long patientId) {
        return prescriptionService.getByPatient(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Prescription> byDoctor(@PathVariable Long doctorId) {
        return prescriptionService.getByDoctor(doctorId);
    }

    @GetMapping("/suggestions")
    public List<Map<String, String>> suggestions(@RequestParam String symptoms) {
        return prescriptionService.getSuggestedMedicines(symptoms);
    }
}
