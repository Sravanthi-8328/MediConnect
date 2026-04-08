package com.mediconnect.backend.controller;

import com.mediconnect.backend.model.*;
import com.mediconnect.backend.repository.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicineOrderRepository medicineOrderRepository;
    private final DoctorVerificationRepository doctorVerificationRepository;
    private final SystemSettingRepository systemSettingRepository;

    public AdminController(UserRepository userRepository,
                           AppointmentRepository appointmentRepository,
                           MedicineOrderRepository medicineOrderRepository,
                           DoctorVerificationRepository doctorVerificationRepository,
                           SystemSettingRepository systemSettingRepository) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicineOrderRepository = medicineOrderRepository;
        this.doctorVerificationRepository = doctorVerificationRepository;
        this.systemSettingRepository = systemSettingRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        long totalPatients = userRepository.findByRole(Role.PATIENT).size();
        long totalDoctors = userRepository.findByRole(Role.DOCTOR).size();
        long totalPharmacists = userRepository.findByRole(Role.PHARMACIST).size();
        long totalAppointments = appointmentRepository.count();
        long todayAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getDate().equals(LocalDate.now()))
                .count();
        long cancelledAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                .count();
        long completedAppointments = appointmentRepository.findAll().stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count();
        double totalRevenue = medicineOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(o -> o.getTotalAmount().doubleValue())
                .reduce(0.0, Double::sum);

        double cancellationRate = totalAppointments > 0 ? (cancelledAppointments * 100.0) / totalAppointments : 0.0;

        return Map.of(
                "totalPatients", totalPatients,
                "totalDoctors", totalDoctors,
                "totalPharmacists", totalPharmacists,
                "totalAppointments", totalAppointments,
                "todayAppointments", todayAppointments,
                "cancelledAppointments", cancelledAppointments,
                "completedAppointments", completedAppointments,
                "totalRevenue", totalRevenue,
                "cancellationRate", String.format("%.1f", cancellationRate)
        );
    }

    @GetMapping("/doctor-verifications")
    public List<DoctorVerification> verifications() {
        return doctorVerificationRepository.findAll();
    }

    @PatchMapping("/doctor-verifications/{doctorId}/verify")
    public DoctorVerification verifyDoctor(@PathVariable Long doctorId) {
        DoctorVerification verification = doctorVerificationRepository.findByDoctorId(doctorId)
                .orElseGet(() -> {
                    User doctor = userRepository.findById(doctorId)
                            .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
                    DoctorVerification v = new DoctorVerification();
                    v.setDoctor(doctor);
                    v.setDocumentsJson("[]");
                    return v;
                });

        verification.setStatus("Verified");
        verification.setVerifiedAt(LocalDate.now());
        return doctorVerificationRepository.save(verification);
    }

    @GetMapping("/settings")
    public Map<String, String> settings() {
        return systemSettingRepository.findAll().stream()
                .collect(Collectors.toMap(SystemSetting::getSettingKey, SystemSetting::getSettingValue));
    }

    @PutMapping("/settings")
    public Map<String, String> updateSettings(@RequestBody Map<String, String> payload) {
        payload.forEach((key, value) -> {
            SystemSetting s = systemSettingRepository.findBySettingKey(key).orElseGet(() -> {
                SystemSetting ns = new SystemSetting();
                ns.setSettingKey(key);
                return ns;
            });
            s.setSettingValue(value);
            systemSettingRepository.save(s);
        });

        return settings();
    }

    @PatchMapping("/users/{userId}/toggle-block")
    public Map<String, Object> toggleUserBlock(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setBlocked(!user.isBlocked());
        userRepository.save(user);
        return Map.of("userId", user.getId(), "blocked", user.isBlocked());
    }
}
