package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.DoctorPayoutAccountRequest;
import com.mediconnect.backend.model.DoctorProfile;
import com.mediconnect.backend.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public List<Map<String, Object>> getDoctors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double maxFee,
            @RequestParam(required = false) Double minRating
    ) {
        return doctorService.searchDoctors(query, specialization, city, maxFee, minRating)
                .stream()
                .map(this::toMap)
                .toList();
    }

        @GetMapping("/{doctorId}")
        public Map<String, Object> getDoctorById(@PathVariable Long doctorId) {
        return toMap(doctorService.getByDoctorUserId(doctorId));
        }

        @GetMapping("/catalog")
        public Map<String, Object> getDoctorCatalog(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Double minFee,
            @RequestParam(required = false) Double maxFee,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "rating") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
        ) {
        String normalizedSort = "name".equalsIgnoreCase(sortBy) ? "user.name" : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(direction, normalizedSort));

        Page<DoctorProfile> result = doctorService.searchCatalog(
            query,
            specialization,
            city,
            country,
            minFee,
            maxFee,
            minRating,
            pageable
        );

        return Map.of(
            "content", result.getContent().stream().map(this::toMap).toList(),
            "page", result.getNumber(),
            "size", result.getSize(),
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages(),
            "hasNext", result.hasNext(),
            "hasPrevious", result.hasPrevious()
        );
        }

        @GetMapping("/filters")
        public Map<String, Object> getDoctorFilters() {
        return Map.of(
            "specializations", doctorService.getSpecializations(),
            "cities", doctorService.getCities(),
            "countries", doctorService.getCountries()
        );
        }

    @PutMapping("/{doctorId}/payout-account")
    public Map<String, Object> updatePayoutAccount(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorPayoutAccountRequest request
    ) {
        return doctorService.updatePayoutAccount(doctorId, request);
    }

    @GetMapping("/{doctorId}/payout-account")
    public Map<String, Object> getPayoutAccount(@PathVariable Long doctorId) {
        return doctorService.getPayoutAccount(doctorId);
    }

    private Map<String, Object> toMap(DoctorProfile d) {
        return Map.ofEntries(
                Map.entry("doctorId", d.getUser().getId()),
                Map.entry("name", d.getUser().getName()),
                Map.entry("email", d.getUser().getEmail()),
                Map.entry("specialization", d.getSpecialization() == null ? "" : d.getSpecialization()),
                Map.entry("experience", d.getExperience() == null ? "" : d.getExperience()),
                Map.entry("city", d.getCity() == null ? "" : d.getCity()),
                Map.entry("country", d.getCountry() == null ? "" : d.getCountry()),
                Map.entry("imageUrl", d.getImageUrl() == null ? "" : d.getImageUrl()),
                Map.entry("fee", d.getFee() == null ? 0.0 : d.getFee()),
                Map.entry("rating", d.getRating() == null ? 0.0 : d.getRating()),
                Map.entry("payoutEnabled", d.isPayoutEnabled())
        );
    }
}
