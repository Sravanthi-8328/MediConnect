package com.mediconnect.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String specialization;
    private String experience;
    private String city;
    private String country;
    private String imageUrl;
    private Double fee;
    private Double rating;

    @Column(nullable = false)
    private boolean payoutEnabled = false;

    private String payoutMode;

    private String payoutAccountHolderName;

    private String payoutUpiId;

    private String payoutBankAccountNumber;

    private String payoutBankIfsc;

    private Integer payoutSharePercent;

    private String razorpayContactId;

    private String razorpayFundAccountId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Double getFee() {
        return fee;
    }

    public void setFee(Double fee) {
        this.fee = fee;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public boolean isPayoutEnabled() {
        return payoutEnabled;
    }

    public void setPayoutEnabled(boolean payoutEnabled) {
        this.payoutEnabled = payoutEnabled;
    }

    public String getPayoutMode() {
        return payoutMode;
    }

    public void setPayoutMode(String payoutMode) {
        this.payoutMode = payoutMode;
    }

    public String getPayoutAccountHolderName() {
        return payoutAccountHolderName;
    }

    public void setPayoutAccountHolderName(String payoutAccountHolderName) {
        this.payoutAccountHolderName = payoutAccountHolderName;
    }

    public String getPayoutUpiId() {
        return payoutUpiId;
    }

    public void setPayoutUpiId(String payoutUpiId) {
        this.payoutUpiId = payoutUpiId;
    }

    public String getPayoutBankAccountNumber() {
        return payoutBankAccountNumber;
    }

    public void setPayoutBankAccountNumber(String payoutBankAccountNumber) {
        this.payoutBankAccountNumber = payoutBankAccountNumber;
    }

    public String getPayoutBankIfsc() {
        return payoutBankIfsc;
    }

    public void setPayoutBankIfsc(String payoutBankIfsc) {
        this.payoutBankIfsc = payoutBankIfsc;
    }

    public Integer getPayoutSharePercent() {
        return payoutSharePercent;
    }

    public void setPayoutSharePercent(Integer payoutSharePercent) {
        this.payoutSharePercent = payoutSharePercent;
    }

    public String getRazorpayContactId() {
        return razorpayContactId;
    }

    public void setRazorpayContactId(String razorpayContactId) {
        this.razorpayContactId = razorpayContactId;
    }

    public String getRazorpayFundAccountId() {
        return razorpayFundAccountId;
    }

    public void setRazorpayFundAccountId(String razorpayFundAccountId) {
        this.razorpayFundAccountId = razorpayFundAccountId;
    }
}
