package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.AppointmentRequest;
import com.mediconnect.backend.dto.AppointmentStatusUpdateRequest;
import com.mediconnect.backend.model.Appointment;
import com.mediconnect.backend.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public Appointment create(@Valid @RequestBody AppointmentRequest request) {
        return appointmentService.createAppointment(request);
    }

    @GetMapping
    public List<Appointment> all() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> byDoctor(@PathVariable Long doctorId) {
        return appointmentService.getDoctorAppointments(doctorId);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> byPatient(@PathVariable Long patientId) {
        return appointmentService.getPatientAppointments(patientId);
    }

    @GetMapping("/doctor/{doctorId}/availability")
    public List<String> availableSlots(@PathVariable Long doctorId, @RequestParam String date) {
        return appointmentService.getAvailableTimeSlots(doctorId, LocalDate.parse(date));
    }

    @PatchMapping("/{id}/status")
    public Appointment updateStatus(@PathVariable Long id, @RequestBody AppointmentStatusUpdateRequest request) {
        return appointmentService.updateStatus(id, request);
    }

    @GetMapping("/{id}/meeting-link")
    public Map<String, String> getMeetingLink(@PathVariable Long id) {
        return Map.of("meetingLink", appointmentService.getOrCreateMeetingLink(id));
    }
}
