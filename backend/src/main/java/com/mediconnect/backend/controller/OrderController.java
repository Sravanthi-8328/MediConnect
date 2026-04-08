package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.OrderRequest;
import com.mediconnect.backend.dto.OrderStatusUpdateRequest;
import com.mediconnect.backend.model.MedicineOrder;
import com.mediconnect.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public MedicineOrder create(@Valid @RequestBody OrderRequest request) {
        return orderService.create(request);
    }

    @PatchMapping("/{id}/status")
    public MedicineOrder updateStatus(@PathVariable Long id, @RequestBody OrderStatusUpdateRequest request) {
        return orderService.updateStatus(id, request);
    }

    @GetMapping("/patient/{patientId}")
    public List<MedicineOrder> byPatient(@PathVariable Long patientId) {
        return orderService.getByPatient(patientId);
    }

    @GetMapping
    public List<MedicineOrder> all() {
        return orderService.getAll();
    }
}
