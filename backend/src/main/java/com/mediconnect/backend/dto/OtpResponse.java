package com.mediconnect.backend.dto;

public class OtpResponse {

    private boolean success;
    private String message;
    private Long expiresInSeconds;

    public OtpResponse() {
    }

    public OtpResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public OtpResponse(boolean success, String message, Long expiresInSeconds) {
        this.success = success;
        this.message = message;
        this.expiresInSeconds = expiresInSeconds;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(Long expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }
}
