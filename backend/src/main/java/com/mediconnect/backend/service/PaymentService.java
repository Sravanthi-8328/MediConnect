package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.ConsultationPaymentRequest;
import com.mediconnect.backend.dto.ConsultationPaymentResponse;
import com.mediconnect.backend.dto.MedicineOrderPaymentRequest;
import com.mediconnect.backend.dto.PaymentVerificationRequest;
import com.mediconnect.backend.model.DoctorProfile;
import com.mediconnect.backend.model.PaymentStatus;
import com.mediconnect.backend.model.PaymentTransaction;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.DoctorProfileRepository;
import com.mediconnect.backend.repository.PaymentTransactionRepository;
import com.mediconnect.backend.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Set<String> UPI_BASED_METHODS = Set.of(
        "UPI",
        "GPAY",
        "PHONEPE",
        "AMAZON_PAY"
    );

    private static final Set<String> NON_INSTRUMENT_METHODS = Set.of(
        "WALLET",
        "NET_BANKING",
        "PAY_LATER",
        "OTHERS"
    );

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${payment.gateway.mode:DEMO}")
    private String gatewayMode;

    @Value("${payment.gateway.name:RAZORPAY}")
    private String gatewayName;

    @Value("${payment.currency:INR}")
    private String paymentCurrency;

    @Value("${payment.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${payment.razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${payment.razorpayx.base-url:https://api.razorpay.com/v1}")
    private String razorpayxBaseUrl;

    @Value("${payment.razorpayx.key-id:}")
    private String razorpayxKeyId;

    @Value("${payment.razorpayx.key-secret:}")
    private String razorpayxKeySecret;

    @Value("${payment.razorpayx.account-number:}")
    private String razorpayxSourceAccountNumber;

    @Value("${payment.payout.default-share-percent:100}")
    private Integer defaultPayoutSharePercent;

    public PaymentService(PaymentTransactionRepository paymentTransactionRepository,
                          UserRepository userRepository,
                          DoctorProfileRepository doctorProfileRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    public ConsultationPaymentResponse payConsultation(ConsultationPaymentRequest request) {
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        BigDecimal amount = parseAmount(request.getAmount());

        PaymentTransaction tx = new PaymentTransaction();
        tx.setPatient(patient);
        tx.setDoctor(doctor);
        tx.setAmount(amount);
        tx.setPurpose("CONSULTATION_FEE");
        tx.setStatus(isLiveMode() ? PaymentStatus.PENDING : PaymentStatus.SUCCESS);
        tx.setTransactionId("TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        applyPaymentInstrument(tx, request.getPaymentMethod(), request.getUpiId(), request.getCardNumber(), request.getCvv());
        tx.setGatewayMode(currentGatewayMode());
        tx.setGatewayName(gatewayName);

        tx.setCreatedAt(LocalDateTime.now());

        if (isLiveMode()) {
            return createLiveGatewayOrder(tx);
        }

        PaymentTransaction saved = paymentTransactionRepository.save(tx);

        ConsultationPaymentResponse response = new ConsultationPaymentResponse();
        response.setSuccess(true);
        response.setMessage("Payment successful");
        response.setTransactionId(saved.getTransactionId());
        response.setStatus(saved.getStatus().name());
        response.setPaymentMethod(saved.getPaymentMethod());
        response.setGatewayMode(saved.getGatewayMode());
        response.setGatewayName(saved.getGatewayName());
        response.setRequiresAction(false);
        return response;
    }

    public ConsultationPaymentResponse payMedicineOrder(MedicineOrderPaymentRequest request) {
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        BigDecimal amount = parseAmount(request.getAmount());

        PaymentTransaction tx = new PaymentTransaction();
        tx.setPatient(patient);
        tx.setDoctor(null);
        tx.setAmount(amount);
        tx.setPurpose("MEDICINE_ORDER");
        tx.setStatus(isLiveMode() ? PaymentStatus.PENDING : PaymentStatus.SUCCESS);
        tx.setTransactionId("TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        applyPaymentInstrument(tx, request.getPaymentMethod(), request.getUpiId(), request.getCardNumber(), request.getCvv());
        tx.setGatewayMode(currentGatewayMode());
        tx.setGatewayName(gatewayName);

        tx.setCreatedAt(LocalDateTime.now());

        if (isLiveMode()) {
            return createLiveGatewayOrder(tx);
        }

        PaymentTransaction saved = paymentTransactionRepository.save(tx);

        ConsultationPaymentResponse response = new ConsultationPaymentResponse();
        response.setSuccess(true);
        response.setMessage("Payment successful");
        response.setTransactionId(saved.getTransactionId());
        response.setStatus(saved.getStatus().name());
        response.setPaymentMethod(saved.getPaymentMethod());
        response.setGatewayMode(saved.getGatewayMode());
        response.setGatewayName(saved.getGatewayName());
        response.setRequiresAction(false);
        return response;
    }

    public ConsultationPaymentResponse verifyGatewayPayment(PaymentVerificationRequest request) {
        if (!isLiveMode()) {
            throw new IllegalArgumentException("Gateway verification is available only in LIVE mode");
        }

        PaymentTransaction tx = paymentTransactionRepository.findByTransactionId(request.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (tx.getStatus() == PaymentStatus.SUCCESS) {
            return toFinalResponse(tx, true, "Payment already verified");
        }

        if (tx.getGatewayOrderId() == null || !tx.getGatewayOrderId().equals(request.getGatewayOrderId())) {
            throw new IllegalArgumentException("Gateway order mismatch");
        }

        validateRazorpaySignature(request.getGatewayOrderId(), request.getGatewayPaymentId(), request.getGatewaySignature());

        tx.setStatus(PaymentStatus.SUCCESS);
        tx.setGatewayPaymentId(request.getGatewayPaymentId());
        tx.setGatewaySignature(request.getGatewaySignature());

        PaymentTransaction saved = paymentTransactionRepository.save(tx);
        String payoutOutcome = processDoctorPayout(saved);
        saved = paymentTransactionRepository.save(saved);

        String message = payoutOutcome == null || payoutOutcome.isBlank()
            ? "Payment verified successfully"
            : "Payment verified successfully. " + payoutOutcome;
        return toFinalResponse(saved, true, message);
    }

    private ConsultationPaymentResponse createLiveGatewayOrder(PaymentTransaction tx) {
        ensureLiveGatewayConfig();

        try {
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            long amountInPaise = toPaise(tx.getAmount());
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", paymentCurrency);
            orderRequest.put("receipt", tx.getTransactionId());
            orderRequest.put("payment_capture", 1);

            Order order = razorpayClient.orders.create(orderRequest);
            tx.setGatewayOrderId(order.get("id"));

            PaymentTransaction saved = paymentTransactionRepository.save(tx);

            ConsultationPaymentResponse response = new ConsultationPaymentResponse();
            response.setSuccess(true);
            response.setMessage("Gateway order created. Complete payment to confirm transaction");
            response.setTransactionId(saved.getTransactionId());
            response.setStatus(saved.getStatus().name());
            response.setPaymentMethod(saved.getPaymentMethod());
            response.setGatewayMode(saved.getGatewayMode());
            response.setGatewayName(saved.getGatewayName());
            response.setGatewayOrderId(saved.getGatewayOrderId());
            response.setGatewayKeyId(razorpayKeyId);
            response.setCurrency(paymentCurrency);
            response.setAmountInPaise(amountInPaise);
            response.setRequiresAction(true);
            return response;
        } catch (RazorpayException ex) {
            throw new IllegalStateException("Unable to create live payment order: " + ex.getMessage());
        }
    }

    private ConsultationPaymentResponse toFinalResponse(PaymentTransaction tx, boolean success, String message) {
        ConsultationPaymentResponse response = new ConsultationPaymentResponse();
        response.setSuccess(success);
        response.setMessage(message);
        response.setTransactionId(tx.getTransactionId());
        response.setStatus(tx.getStatus().name());
        response.setPaymentMethod(tx.getPaymentMethod());
        response.setGatewayMode(tx.getGatewayMode());
        response.setGatewayName(tx.getGatewayName());
        response.setGatewayOrderId(tx.getGatewayOrderId());
        response.setPayoutId(tx.getPayoutId());
        response.setPayoutStatus(tx.getPayoutStatus());
        response.setRequiresAction(false);
        return response;
    }

    private String processDoctorPayout(PaymentTransaction tx) {
        if (!isLiveMode()) {
            return null;
        }

        if (!"CONSULTATION_FEE".equals(tx.getPurpose()) || tx.getDoctor() == null) {
            return null;
        }

        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(tx.getDoctor().getId())
                .orElse(null);

        if (doctorProfile == null || !doctorProfile.isPayoutEnabled()) {
            tx.setPayoutStatus("SKIPPED");
            tx.setPayoutError("Doctor payout account is not configured");
            return "Doctor payout skipped: payout account not configured.";
        }

        try {
            ensurePayoutConfig();
            ensureDoctorFundAccount(doctorProfile);

            int share = doctorProfile.getPayoutSharePercent() == null
                    ? Math.min(Math.max(defaultPayoutSharePercent == null ? 100 : defaultPayoutSharePercent, 1), 100)
                    : Math.min(Math.max(doctorProfile.getPayoutSharePercent(), 1), 100);

            BigDecimal payoutAmount = tx.getAmount().multiply(BigDecimal.valueOf(share))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            JSONObject payoutBody = new JSONObject();
            payoutBody.put("account_number", razorpayxSourceAccountNumber);
            payoutBody.put("fund_account_id", doctorProfile.getRazorpayFundAccountId());
            payoutBody.put("amount", toPaise(payoutAmount));
            payoutBody.put("currency", paymentCurrency);
            payoutBody.put("mode", "UPI".equalsIgnoreCase(doctorProfile.getPayoutMode()) ? "UPI" : "IMPS");
            payoutBody.put("purpose", "payout");
            payoutBody.put("queue_if_low_balance", true);
            payoutBody.put("reference_id", tx.getTransactionId());
            payoutBody.put("narration", "Doctor consultation payout");

            JSONObject payoutResponse = postRazorpayX("/payouts", payoutBody);
            tx.setPayoutId(payoutResponse.optString("id", ""));
            tx.setPayoutStatus(payoutResponse.optString("status", "queued"));
            tx.setPayoutError(null);
            return "Doctor payout initiated successfully.";
        } catch (Exception ex) {
            tx.setPayoutStatus("FAILED");
            tx.setPayoutError(ex.getMessage());
            return "Doctor payout failed: " + ex.getMessage();
        }
    }

    private void ensureDoctorFundAccount(DoctorProfile doctorProfile) {
        if (doctorProfile.getRazorpayContactId() == null || doctorProfile.getRazorpayContactId().isBlank()) {
            JSONObject contactBody = new JSONObject();
            contactBody.put("name", doctorProfile.getPayoutAccountHolderName());
            contactBody.put("email", doctorProfile.getUser().getEmail());
            contactBody.put("contact", doctorProfile.getUser().getPhone() == null ? "9999999999" : doctorProfile.getUser().getPhone());
            contactBody.put("type", "vendor");
            contactBody.put("reference_id", "doctor-" + doctorProfile.getUser().getId());

            JSONObject contactResponse = postRazorpayX("/contacts", contactBody);
            doctorProfile.setRazorpayContactId(contactResponse.getString("id"));
        }

        if (doctorProfile.getRazorpayFundAccountId() == null || doctorProfile.getRazorpayFundAccountId().isBlank()) {
            JSONObject fundBody = new JSONObject();
            fundBody.put("contact_id", doctorProfile.getRazorpayContactId());

            String mode = doctorProfile.getPayoutMode() == null ? "" : doctorProfile.getPayoutMode().trim().toUpperCase(Locale.ROOT);
            if ("UPI".equals(mode)) {
                JSONObject vpa = new JSONObject();
                vpa.put("address", doctorProfile.getPayoutUpiId());
                vpa.put("name", doctorProfile.getPayoutAccountHolderName());
                fundBody.put("account_type", "vpa");
                fundBody.put("vpa", vpa);
            } else {
                JSONObject bankAccount = new JSONObject();
                bankAccount.put("name", doctorProfile.getPayoutAccountHolderName());
                bankAccount.put("ifsc", doctorProfile.getPayoutBankIfsc());
                bankAccount.put("account_number", doctorProfile.getPayoutBankAccountNumber());
                fundBody.put("account_type", "bank_account");
                fundBody.put("bank_account", bankAccount);
            }

            JSONObject fundResponse = postRazorpayX("/fund_accounts", fundBody);
            doctorProfile.setRazorpayFundAccountId(fundResponse.getString("id"));
        }

        doctorProfileRepository.save(doctorProfile);
    }

    private JSONObject postRazorpayX(String path, JSONObject payload) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(razorpayxBaseUrl + path))
                    .header("Content-Type", "application/json")
                    .header("Authorization", basicAuthHeader(resolveRazorpayxKeyId(), resolveRazorpayxKeySecret()))
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("RazorpayX API error: " + response.body());
            }
            return new JSONObject(response.body());
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to call RazorpayX: " + ex.getMessage());
        }
    }

    private String basicAuthHeader(String keyId, String keySecret) {
        String token = keyId + ":" + keySecret;
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private String resolveRazorpayxKeyId() {
        return (razorpayxKeyId == null || razorpayxKeyId.isBlank()) ? razorpayKeyId : razorpayxKeyId;
    }

    private String resolveRazorpayxKeySecret() {
        return (razorpayxKeySecret == null || razorpayxKeySecret.isBlank()) ? razorpayKeySecret : razorpayxKeySecret;
    }

    private void validateRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac hmacSha256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmacSha256.init(keySpec);

            byte[] digest = hmacSha256.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = bytesToHex(digest);

            if (!expected.equalsIgnoreCase(signature)) {
                throw new IllegalArgumentException("Invalid payment signature");
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to verify gateway signature");
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private BigDecimal parseAmount(String rawAmount) {
        try {
            BigDecimal amount = new BigDecimal(rawAmount);
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Amount must be greater than zero");
            }
            return amount.setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid amount");
        }
    }

    private long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private boolean isLiveMode() {
        return "LIVE".equalsIgnoreCase(currentGatewayMode());
    }

    private String currentGatewayMode() {
        return gatewayMode == null ? "DEMO" : gatewayMode.trim().toUpperCase();
    }

    private void ensureLiveGatewayConfig() {
        if (razorpayKeyId == null || razorpayKeyId.isBlank() || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new IllegalStateException("Razorpay keys are not configured. Set payment.razorpay.key-id and payment.razorpay.key-secret");
        }
    }

    private void ensurePayoutConfig() {
        if (resolveRazorpayxKeyId() == null || resolveRazorpayxKeyId().isBlank()
                || resolveRazorpayxKeySecret() == null || resolveRazorpayxKeySecret().isBlank()) {
            throw new IllegalStateException("RazorpayX keys are not configured");
        }

        if (razorpayxSourceAccountNumber == null || razorpayxSourceAccountNumber.isBlank()) {
            throw new IllegalStateException("RazorpayX source account number is not configured");
        }
    }

    private void applyPaymentInstrument(PaymentTransaction tx,
                                        String paymentMethod,
                                        String upiId,
                                        String cardNumber,
                                        String cvv) {
        String method = normalizePaymentMethod(paymentMethod);

        if (method.equals("CARD")) {
            String safeCardNumber = cardNumber == null ? "" : cardNumber;
            String cleanCard = safeCardNumber.replaceAll("\\s+", "");
            if (cleanCard.length() < 12) {
                throw new IllegalArgumentException("Invalid card number");
            }
            String safeCvv = cvv == null ? "" : cvv;
            if (safeCvv.length() < 3) {
                throw new IllegalArgumentException("Invalid CVV");
            }
            tx.setPaymentMethod("CARD");
            tx.setCardLast4(cleanCard.substring(cleanCard.length() - 4));
            tx.setUpiId(null);
            return;
        }

        if (UPI_BASED_METHODS.contains(method)) {
            String safeUpiId = upiId == null ? "" : upiId.trim();
            if (safeUpiId.isBlank() || !safeUpiId.contains("@") || safeUpiId.length() < 5) {
                throw new IllegalArgumentException("Invalid UPI ID");
            }
            tx.setPaymentMethod(method);
            tx.setUpiId(safeUpiId);
            tx.setCardLast4(null);
            return;
        }

        if (NON_INSTRUMENT_METHODS.contains(method)) {
            tx.setPaymentMethod(method);
            tx.setUpiId(null);
            tx.setCardLast4(null);
            return;
        }

        throw new IllegalArgumentException("Unsupported payment method");
    }

    private String normalizePaymentMethod(String paymentMethod) {
        return paymentMethod == null ? "" : paymentMethod.trim().toUpperCase().replace(' ', '_').replace('/', '_');
    }
}
