package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.PrescriptionRequest;
import com.mediconnect.backend.model.Appointment;
import com.mediconnect.backend.model.AppointmentStatus;
import com.mediconnect.backend.model.Prescription;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.AppointmentRepository;
import com.mediconnect.backend.repository.PrescriptionRepository;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               AppointmentRepository appointmentRepository,
                               UserRepository userRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    public Prescription create(PrescriptionRequest request) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        Prescription prescription = new Prescription();
        prescription.setAppointment(appointment);
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setMedicinesJson(request.getMedicinesJson());
        prescription.setNotes(request.getNotes());
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setCreatedAt(LocalDateTime.now());

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setDiagnosis(request.getDiagnosis());
        appointment.setNotes(request.getNotes());
        appointmentRepository.save(appointment);

        return prescriptionRepository.save(prescription);
    }

    public List<Prescription> getByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<Prescription> getByDoctor(Long doctorId) {
        return prescriptionRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
    }

    public List<Prescription> getAll() {
        return prescriptionRepository.findAll();
    }

    public List<Map<String, String>> getSuggestedMedicines(String symptomsText) {
        String symptoms = symptomsText == null ? "" : symptomsText.toLowerCase();
        List<Map<String, String>> suggestions = new ArrayList<>();

        if (symptoms.contains("fever") || symptoms.contains("cold") || symptoms.contains("flu")) {
            suggestions.add(medicine("Paracetamol", "500mg", "Twice daily", "5 days", "After food"));
            suggestions.add(medicine("Cetirizine", "10mg", "Once daily", "5 days", "At bedtime"));
        }

        if (symptoms.contains("headache") || symptoms.contains("migraine")) {
            suggestions.add(medicine("Ibuprofen", "400mg", "Twice daily", "3 days", "After food"));
        }

        if (symptoms.contains("cough") || symptoms.contains("sore throat")) {
            suggestions.add(medicine("Cough Syrup", "10ml", "Thrice daily", "5 days", "After meals"));
        }

        if (symptoms.contains("stomach") || symptoms.contains("acidity") || symptoms.contains("gastric")) {
            suggestions.add(medicine("Omeprazole", "20mg", "Once daily", "7 days", "Before breakfast"));
        }

        if (symptoms.contains("bp") || symptoms.contains("blood pressure") || symptoms.contains("hypertension")) {
            suggestions.add(medicine("Losartan", "50mg", "Once daily", "30 days", "Same time every day"));
        }

        if (suggestions.isEmpty()) {
            suggestions.add(medicine("", "", "", "", ""));
        }

        return suggestions;
    }

    private Map<String, String> medicine(String name, String dosage, String frequency, String duration, String instructions) {
        Map<String, String> med = new HashMap<>();
        med.put("name", name);
        med.put("dosage", dosage);
        med.put("frequency", frequency);
        med.put("duration", duration);
        med.put("instructions", instructions);
        return med;
    }
}
