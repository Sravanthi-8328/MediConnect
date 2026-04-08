package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.AppointmentRequest;
import com.mediconnect.backend.dto.AppointmentStatusUpdateRequest;
import com.mediconnect.backend.model.Appointment;
import com.mediconnect.backend.model.AppointmentStatus;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.AppointmentRepository;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.Collection;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private static final String JITSI_BASE_URL = "https://meet.jit.si";

    private static final List<String> DEFAULT_TIME_SLOTS = List.of(
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
        "07:00 PM", "07:20 PM", "07:40 PM"
    );

    private static final Collection<AppointmentStatus> UNAVAILABLE_STATUSES = List.of(
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.RESCHEDULED,
        AppointmentStatus.COMPLETED
    );

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    public Appointment createAppointment(AppointmentRequest request) {
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        LocalDate appointmentDate;
        try {
            appointmentDate = LocalDate.parse(request.getDate());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Invalid appointment date");
        }

        boolean slotTaken = appointmentRepository.existsByDoctorIdAndDateAndTimeAndStatusNotIn(
                doctor.getId(),
                appointmentDate,
                request.getTime(),
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED)
        );
        if (slotTaken) {
            throw new IllegalArgumentException("Selected time slot is no longer available");
        }

        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setDate(appointmentDate);
        appointment.setTime(request.getTime());
        appointment.setType(request.getType());
        appointment.setBookingFor(request.getPatientBookingFor());
        appointment.setPatientName(request.getPatientName());
        appointment.setPatientPhone(request.getPatientPhone());
        appointment.setPatientEmail(request.getPatientEmail());
        appointment.setSymptoms(request.getSymptoms());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setPaymentStatus(request.getPaymentStatus() == null ? "UNPAID" : request.getPaymentStatus());
        appointment.setPaymentTransactionId(request.getPaymentTransactionId());
        if (request.getConsultationFee() != null && !request.getConsultationFee().isBlank()) {
            appointment.setConsultationFee(new BigDecimal(request.getConsultationFee()));
        }
        appointment.setCreatedAt(LocalDateTime.now());

        if ("Video".equalsIgnoreCase(request.getType())) {
            appointment.setMeetingLink(buildJitsiMeetingLink(doctor.getId(), patient.getId()));
        }

        return appointmentRepository.save(appointment);
    }

    public String getOrCreateMeetingLink(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        String existingLink = appointment.getMeetingLink();
        if (isValidMeetingLink(existingLink)) {
            return existingLink;
        }

        String generatedLink = buildJitsiMeetingLink(
                appointment.getDoctor().getId(),
                appointment.getPatient().getId()
        );
        appointment.setMeetingLink(generatedLink);
        appointmentRepository.save(appointment);
        return generatedLink;
    }

    private boolean isValidMeetingLink(String meetingLink) {
        return meetingLink != null
                && !meetingLink.isBlank()
                && meetingLink.startsWith(JITSI_BASE_URL + "/");
    }

    private String buildJitsiMeetingLink(Long doctorId, Long patientId) {
        String roomName = String.format(
                Locale.ROOT,
                "mediconnect-doc%s-pat%s-%s",
                doctorId,
                patientId,
                UUID.randomUUID().toString().substring(0, 8)
        );
        return JITSI_BASE_URL + "/" + roomName;
    }

    public List<String> getAvailableTimeSlots(Long doctorId, LocalDate date) {
        Set<String> bookedTimes = appointmentRepository.findByDoctorIdAndDateAndStatusNotIn(
                        doctorId,
                        date,
                        List.of(AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED)
                )
                .stream()
                .map(Appointment::getTime)
                .collect(Collectors.toSet());

        return DEFAULT_TIME_SLOTS.stream()
                .filter(time -> !bookedTimes.contains(time))
                .toList();
    }

    public List<Appointment> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByDateAsc(doctorId);
    }

    public List<Appointment> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByDateDesc(patientId);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment updateStatus(Long appointmentId, AppointmentStatusUpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.valueOf(request.getStatus().toUpperCase()));

        if (request.getDiagnosis() != null) {
            appointment.setDiagnosis(request.getDiagnosis());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }
        if (request.getRejectionReason() != null) {
            appointment.setRejectionReason(request.getRejectionReason());
        }

        return appointmentRepository.save(appointment);
    }
}
