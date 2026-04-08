package com.mediconnect.backend.service;

import com.mediconnect.backend.dto.DoctorPayoutAccountRequest;
import com.mediconnect.backend.model.DoctorProfile;
import com.mediconnect.backend.repository.DoctorProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;

    public DoctorService(DoctorProfileRepository doctorProfileRepository) {
        this.doctorProfileRepository = doctorProfileRepository;
    }

    public List<DoctorProfile> getAllDoctors() {
        return doctorProfileRepository.findAll();
    }

    public List<DoctorProfile> searchDoctors(String query, String specialization, String city, Double maxFee, Double minRating) {
        return searchCatalog(query, specialization, city, null, null, maxFee, minRating, Pageable.unpaged()).getContent();
    }

    public Page<DoctorProfile> searchCatalog(
            String query,
            String specialization,
            String city,
            String country,
            Double minFee,
            Double maxFee,
            Double minRating,
            Pageable pageable
    ) {
        return doctorProfileRepository.findAll(buildSpecification(query, specialization, city, country, minFee, maxFee, minRating), pageable);
    }

    public DoctorProfile getByDoctorUserId(Long doctorUserId) {
        return doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + doctorUserId));
    }

    public List<String> getSpecializations() {
        return doctorProfileRepository.findAll().stream()
                .map(DoctorProfile::getSpecialization)
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public List<String> getCities() {
        return doctorProfileRepository.findAll().stream()
                .map(DoctorProfile::getCity)
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public List<String> getCountries() {
        return doctorProfileRepository.findAll().stream()
                .map(DoctorProfile::getCountry)
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public Map<String, Object> updatePayoutAccount(Long doctorUserId, DoctorPayoutAccountRequest request) {
        DoctorProfile profile = getByDoctorUserId(doctorUserId);
        String mode = request.getPayoutMode().trim().toUpperCase(Locale.ROOT);

        if (!mode.equals("UPI") && !mode.equals("BANK")) {
            throw new IllegalArgumentException("Payout mode must be UPI or BANK");
        }

        if (mode.equals("UPI")) {
            String upiId = request.getUpiId() == null ? "" : request.getUpiId().trim();
            if (upiId.isBlank() || !upiId.contains("@")) {
                throw new IllegalArgumentException("Valid UPI ID is required for UPI payout");
            }
            profile.setPayoutUpiId(upiId);
            profile.setPayoutBankAccountNumber(null);
            profile.setPayoutBankIfsc(null);
        } else {
            String accountNumber = request.getBankAccountNumber() == null ? "" : request.getBankAccountNumber().trim();
            String ifsc = request.getBankIfsc() == null ? "" : request.getBankIfsc().trim().toUpperCase(Locale.ROOT);
            if (accountNumber.isBlank() || ifsc.isBlank()) {
                throw new IllegalArgumentException("Bank account number and IFSC are required for BANK payout");
            }
            profile.setPayoutBankAccountNumber(accountNumber);
            profile.setPayoutBankIfsc(ifsc);
            profile.setPayoutUpiId(null);
        }

        profile.setPayoutMode(mode);
        profile.setPayoutEnabled(true);
        profile.setPayoutAccountHolderName(request.getAccountHolderName().trim());
        profile.setPayoutSharePercent(request.getPayoutSharePercent() == null ? 100 : request.getPayoutSharePercent());
        profile.setRazorpayContactId(null);
        profile.setRazorpayFundAccountId(null);

        DoctorProfile saved = doctorProfileRepository.save(profile);
        return payoutSummary(saved);
    }

    public Map<String, Object> getPayoutAccount(Long doctorUserId) {
        return payoutSummary(getByDoctorUserId(doctorUserId));
    }

    private Map<String, Object> payoutSummary(DoctorProfile profile) {
        return Map.of(
                "doctorId", profile.getUser().getId(),
                "payoutEnabled", profile.isPayoutEnabled(),
                "payoutMode", profile.getPayoutMode() == null ? "" : profile.getPayoutMode(),
                "accountHolderName", profile.getPayoutAccountHolderName() == null ? "" : profile.getPayoutAccountHolderName(),
                "upiId", profile.getPayoutUpiId() == null ? "" : profile.getPayoutUpiId(),
                "bankAccountNumberMasked", maskBankAccount(profile.getPayoutBankAccountNumber()),
                "bankIfsc", profile.getPayoutBankIfsc() == null ? "" : profile.getPayoutBankIfsc(),
                "payoutSharePercent", profile.getPayoutSharePercent() == null ? 100 : profile.getPayoutSharePercent()
        );
    }

    private String maskBankAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "";
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    private Specification<DoctorProfile> buildSpecification(
            String query,
            String specialization,
            String city,
            String country,
            Double minFee,
            Double maxFee,
            Double minRating
    ) {
        return (root, q, cb) -> {
            var predicates = cb.conjunction();

            if (query != null && !query.isBlank()) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                var byName = cb.like(cb.lower(root.join("user").get("name")), like);
                var bySpecialization = cb.like(cb.lower(root.get("specialization")), like);
                predicates = cb.and(predicates, cb.or(byName, bySpecialization));
            }

            if (specialization != null && !specialization.isBlank()) {
                predicates = cb.and(predicates, cb.equal(cb.lower(root.get("specialization")), specialization.trim().toLowerCase(Locale.ROOT)));
            }

            if (city != null && !city.isBlank()) {
                predicates = cb.and(predicates, cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase(Locale.ROOT)));
            }

            if (country != null && !country.isBlank()) {
                predicates = cb.and(predicates, cb.equal(cb.lower(root.get("country")), country.trim().toLowerCase(Locale.ROOT)));
            }

            if (minFee != null) {
                predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("fee"), minFee));
            }

            if (maxFee != null) {
                predicates = cb.and(predicates, cb.lessThanOrEqualTo(root.get("fee"), maxFee));
            }

            if (minRating != null) {
                predicates = cb.and(predicates, cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }

            return predicates;
        };
    }
}
