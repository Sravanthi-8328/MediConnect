package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.Appointment;
import com.mediconnect.backend.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Collection;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorIdOrderByDateAsc(Long doctorId);
    List<Appointment> findByPatientIdOrderByDateDesc(Long patientId);
    List<Appointment> findByDoctorIdAndDateAndStatusNotIn(Long doctorId, LocalDate date, Collection<AppointmentStatus> statuses);
    boolean existsByDoctorIdAndDateAndTimeAndStatusNotIn(Long doctorId, LocalDate date, String time, Collection<AppointmentStatus> statuses);
}
