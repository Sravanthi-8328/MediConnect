package com.mediconnect.backend.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "doctor_verifications")
public class DoctorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "doctor_user_id", nullable = false, unique = true)
    private User doctor;

    @Column(nullable = false)
    private String status;

    private LocalDate verifiedAt;

    @Column(length = 4000)
    private String documentsJson;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getDoctor() {
        return doctor;
    }

    public void setDoctor(User doctor) {
        this.doctor = doctor;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDate verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getDocumentsJson() {
        return documentsJson;
    }

    public void setDocumentsJson(String documentsJson) {
        this.documentsJson = documentsJson;
    }
}
