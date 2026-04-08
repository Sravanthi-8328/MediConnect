package com.mediconnect.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpSendRequest {

    @NotBlank
    private String phoneNumber;

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
}
