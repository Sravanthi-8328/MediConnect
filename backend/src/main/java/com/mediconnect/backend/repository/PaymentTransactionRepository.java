package com.mediconnect.backend.repository;

import com.mediconnect.backend.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
	Optional<PaymentTransaction> findByTransactionId(String transactionId);
}
