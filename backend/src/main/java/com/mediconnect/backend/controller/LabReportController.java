package com.mediconnect.backend.controller;

import com.mediconnect.backend.dto.LabReportCreateRequest;
import com.mediconnect.backend.model.LabReport;
import com.mediconnect.backend.model.User;
import com.mediconnect.backend.repository.LabReportRepository;
import com.mediconnect.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/lab-reports")
public class LabReportController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "png", "jpg", "jpeg");

    private final LabReportRepository labReportRepository;
    private final UserRepository userRepository;
    private final Path uploadDir;

    public LabReportController(
            LabReportRepository labReportRepository,
            UserRepository userRepository,
            @Value("${app.upload.dir:uploads}") String uploadDir
    ) {
        this.labReportRepository = labReportRepository;
        this.userRepository = userRepository;
        this.uploadDir = Paths.get(uploadDir, "lab-reports").toAbsolutePath().normalize();
    }

    @GetMapping("/patient/{patientId}")
    public List<LabReport> byPatient(@PathVariable Long patientId) {
        return labReportRepository.findByPatientIdOrderByDateDesc(patientId);
    }

    @PostMapping
    public LabReport create(@RequestBody LabReportCreateRequest request) {
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        LabReport report = new LabReport();
        report.setId(null);
        report.setPatient(patient);
        report.setName(request.getName());
        report.setType(request.getType());
        report.setDate(parseReportDate(request.getDate()));
        report.setDoctor(request.getDoctor());
        report.setLab(request.getLab());
        report.setStatus(request.getStatus());
        report.setResultsJson(request.getResultsJson());
        report.setFileUrl(request.getFileUrl());
        report.setCreatedAt(LocalDateTime.now());
        return labReportRepository.save(report);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose a file to upload");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = StringUtils.getFilenameExtension(originalFileName);
        String normalizedExtension = extension == null ? "" : extension.toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(normalizedExtension)) {
            throw new IllegalArgumentException("Only PDF, PNG and JPG files are supported");
        }

        String safeBaseName = originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedFileName = UUID.randomUUID().toString().substring(0, 12) + "_" + safeBaseName;

        try {
            Files.createDirectories(uploadDir);
            Path targetLocation = uploadDir.resolve(storedFileName).normalize();
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/lab-reports/file/")
                    .path(storedFileName)
                    .toUriString();

            return Map.of(
                    "fileUrl", fileUrl,
                    "fileName", originalFileName
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to upload file. Please try again");
        }
    }

    @GetMapping("/file/{fileName:.+}")
    public ResponseEntity<Resource> getUploadedFile(@PathVariable String fileName) {
        try {
            String safeFileName = Paths.get(fileName).getFileName().toString();
            Path filePath = uploadDir.resolve(safeFileName).normalize();

            if (!Files.exists(filePath)) {
                throw new IllegalArgumentException("File not found");
            }

            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null || contentType.isBlank()) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFileName + "\"")
                    .body(resource);
        } catch (MalformedURLException ex) {
            throw new IllegalArgumentException("Invalid file path");
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to read uploaded file");
        }
    }

    private LocalDate parseReportDate(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Report date is required");
        }

        String normalizedValue = value.trim().replaceAll("\\s+", "");

        try {
            return LocalDate.parse(normalizedValue);
        } catch (DateTimeParseException ignored) {
            // Accept common locale date inputs from browsers/users.
        }

        DateTimeFormatter[] fallbackFormats = new DateTimeFormatter[] {
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy")
        };

        for (DateTimeFormatter formatter : fallbackFormats) {
            try {
                return LocalDate.parse(normalizedValue, formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next pattern.
            }
        }

        throw new IllegalArgumentException("Invalid report date. Use YYYY-MM-DD or DD/MM/YYYY");
    }
}
