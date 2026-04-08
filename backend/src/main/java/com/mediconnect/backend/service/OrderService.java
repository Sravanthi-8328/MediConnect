package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.OrderRequest;
import com.mediconnect.backend.dto.OrderStatusUpdateRequest;
import com.mediconnect.backend.model.MedicineOrder;
import com.mediconnect.backend.model.OrderStatus;
import com.mediconnect.backend.model.PaymentStatus;
import com.mediconnect.backend.model.Prescription;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.MedicineOrderRepository;
import com.mediconnect.backend.repository.PrescriptionRepository;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final MedicineOrderRepository medicineOrderRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    public OrderService(MedicineOrderRepository medicineOrderRepository,
                        PrescriptionRepository prescriptionRepository,
                        UserRepository userRepository) {
        this.medicineOrderRepository = medicineOrderRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
    }

    public MedicineOrder create(OrderRequest request) {
        Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found"));
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        MedicineOrder order = new MedicineOrder();
        order.setPrescription(prescription);
        order.setPatient(patient);
        order.setMedicinesJson(request.getMedicinesJson());
        order.setTotalAmount(new BigDecimal(request.getTotalAmount()));
        order.setStatus(OrderStatus.PROCESSING);
        order.setAddress(request.getAddress());
        order.setOrderDate(LocalDate.now());
        order.setTrackingId("MC-" + System.currentTimeMillis());
        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            order.setPaymentStatus(PaymentStatus.valueOf(request.getPaymentStatus().trim().toUpperCase()));
        } else {
            order.setPaymentStatus(PaymentStatus.PENDING);
        }
        order.setPaymentTransactionId(request.getPaymentTransactionId());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setCreatedAt(LocalDateTime.now());

        return medicineOrderRepository.save(order);
    }

    public MedicineOrder updateStatus(Long id, OrderStatusUpdateRequest request) {
        MedicineOrder order = medicineOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        OrderStatus newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase().replace(" ", "_"));
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveryDate(LocalDate.now());
        }

        return medicineOrderRepository.save(order);
    }

    public List<MedicineOrder> getByPatient(Long patientId) {
        return medicineOrderRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<MedicineOrder> getAll() {
        return medicineOrderRepository.findAll();
    }
}
