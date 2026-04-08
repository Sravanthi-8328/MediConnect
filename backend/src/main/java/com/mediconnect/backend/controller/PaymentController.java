package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.ConsultationPaymentRequest;
import com.mediconnect.backend.dto.ConsultationPaymentResponse;
import com.mediconnect.backend.dto.MedicineOrderPaymentRequest;
import com.mediconnect.backend.dto.PaymentVerificationRequest;
import com.mediconnect.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/consultation")
    public ConsultationPaymentResponse payConsultation(@Valid @RequestBody ConsultationPaymentRequest request) {
        return paymentService.payConsultation(request);
    }

    @PostMapping("/medicine-order")
    public ConsultationPaymentResponse payMedicineOrder(@Valid @RequestBody MedicineOrderPaymentRequest request) {
        return paymentService.payMedicineOrder(request);
    }

    @PostMapping("/verify")
    public ConsultationPaymentResponse verifyGatewayPayment(@Valid @RequestBody PaymentVerificationRequest request) {
        return paymentService.verifyGatewayPayment(request);
    }
}
