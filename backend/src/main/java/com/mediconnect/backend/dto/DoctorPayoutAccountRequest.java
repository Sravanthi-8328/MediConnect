package com.mediconnect.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class DoctorPayoutAccountRequest {

    @NotBlank
    private String payoutMode;

    @NotBlank
    private String accountHolderName;

    private String upiId;

    private String bankAccountNumber;

    private String bankIfsc;

    @Min(1)
    @Max(100)
    private Integer payoutSharePercent;

    public String getPayoutMode() {
        return payoutMode;
    }

    public void setPayoutMode(String payoutMode) {
        this.payoutMode = payoutMode;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getBankIfsc() {
        return bankIfsc;
    }

    public void setBankIfsc(String bankIfsc) {
        this.bankIfsc = bankIfsc;
    }

    public Integer getPayoutSharePercent() {
        return payoutSharePercent;
    }

    public void setPayoutSharePercent(Integer payoutSharePercent) {
        this.payoutSharePercent = payoutSharePercent;
    }
}
