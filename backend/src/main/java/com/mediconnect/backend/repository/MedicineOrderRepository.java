package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.MedicineOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineOrderRepository extends JpaRepository<MedicineOrder, Long> {
    List<MedicineOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
