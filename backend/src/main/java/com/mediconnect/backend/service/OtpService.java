package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.OtpResponse;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    @Value("${otp.code.length:6}")
    private int otpCodeLength;

    @Value("${otp.expiry.seconds:300}")
    private long otpExpirySeconds;

    @Value("${otp.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${otp.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${otp.twilio.from-number:}")
    private String twilioFromNumber;

    public OtpResponse sendOtp(String phoneNumber) {
        String normalizedPhone = normalizePhone(phoneNumber);
        validatePhone(normalizedPhone);
        validateTwilioConfig();

        String otpCode = generateOtpCode();
        Instant expiresAt = Instant.now().plusSeconds(otpExpirySeconds);
        otpStore.put(normalizedPhone, new OtpEntry(otpCode, expiresAt));

        sendSms(normalizedPhone, otpCode);

        return new OtpResponse(true, "OTP sent successfully", otpExpirySeconds);
    }

    public OtpResponse verifyOtp(String phoneNumber, String otp) {
        String normalizedPhone = normalizePhone(phoneNumber);
        validatePhone(normalizedPhone);

        OtpEntry entry = otpStore.get(normalizedPhone);
        if (entry == null) {
            throw new IllegalArgumentException("No OTP request found for this phone number");
        }

        if (Instant.now().isAfter(entry.expiresAt)) {
            otpStore.remove(normalizedPhone);
            throw new IllegalArgumentException("OTP expired. Please request a new OTP");
        }

        if (!entry.code.equals((otp == null ? "" : otp.trim()))) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        otpStore.remove(normalizedPhone);
        return new OtpResponse(true, "OTP verified successfully");
    }

    private void sendSms(String toPhoneNumber, String otpCode) {
        Twilio.init(twilioAccountSid, twilioAuthToken);
        String body = "Your MediConnect OTP is " + otpCode + ". It expires in " + (otpExpirySeconds / 60) + " minutes.";

        Message.creator(
                new PhoneNumber(toPhoneNumber),
                new PhoneNumber(twilioFromNumber),
                body
        ).create();
    }

    private void validateTwilioConfig() {
        if (isBlank(twilioAccountSid) || isBlank(twilioAuthToken) || isBlank(twilioFromNumber)) {
            throw new IllegalArgumentException("SMS service is not configured. Please set Twilio credentials in backend application.properties");
        }
    }

    private String generateOtpCode() {
        int max = (int) Math.pow(10, otpCodeLength);
        int min = (int) Math.pow(10, otpCodeLength - 1);
        return String.valueOf(min + random.nextInt(max - min));
    }

    private String normalizePhone(String phone) {
        return (phone == null ? "" : phone).replaceAll("\\s+", "").trim();
    }

    private void validatePhone(String phone) {
        if (!phone.matches("^\\+?[0-9]{10,15}$")) {
            throw new IllegalArgumentException("Invalid phone number format");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static class OtpEntry {
        private final String code;
        private final Instant expiresAt;

        private OtpEntry(String code, Instant expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }
}
