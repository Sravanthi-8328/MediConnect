package com.mediconnect.backend.service;

import com.mediconnect.backend.model.*;
import com.mediconnect.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicineOrderRepository medicineOrderRepository;
    private final NotificationRepository notificationRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final LabReportRepository labReportRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final DoctorVerificationRepository doctorVerificationRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      DoctorProfileRepository doctorProfileRepository,
                      AppointmentRepository appointmentRepository,
                      PrescriptionRepository prescriptionRepository,
                      MedicineOrderRepository medicineOrderRepository,
                      NotificationRepository notificationRepository,
                      InventoryItemRepository inventoryItemRepository,
                      LabReportRepository labReportRepository,
                      HealthRecordRepository healthRecordRepository,
                      DoctorVerificationRepository doctorVerificationRepository,
                      SystemSettingRepository systemSettingRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicineOrderRepository = medicineOrderRepository;
        this.notificationRepository = notificationRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.labReportRepository = labReportRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.doctorVerificationRepository = doctorVerificationRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            ensureAdditionalDoctors();
            ensureAdditionalInventory();
            return;
        }

        User admin = createUser("Admin User", "admin@mediconnect.com", "Admin@2026", Role.ADMIN);
        User doctor1 = createUser("Dr. Ananya Rao", "ananya.rao@mediconnect.com", "Ananya@2026", Role.DOCTOR);
        User doctor2 = createUser("Dr. Arjun Menon", "arjun.menon@mediconnect.com", "Arjun@2026", Role.DOCTOR);
        User doctor3 = createUser("Dr. Meera Iyer", "meera.iyer@mediconnect.com", "Meera@2026", Role.DOCTOR);
        User doctor4 = createUser("Dr. Vikram Kapoor", "vikram.kapoor@mediconnect.com", "Vikram@2026", Role.DOCTOR);
        User doctor5 = createUser("Dr. Nisha Verma", "nisha.verma@mediconnect.com", "Nisha@2026", Role.DOCTOR);
        User doctor6 = createUser("Dr. Rohan Kulkarni", "rohan.kulkarni@mediconnect.com", "Rohan@2026", Role.DOCTOR);
        User doctor7 = createUser("Dr. Sana Mirza", "sana.mirza@mediconnect.com", "Sana@2026", Role.DOCTOR);
        User doctor8 = createUser("Dr. Karthik Reddy", "karthik.reddy@mediconnect.com", "Karthik@2026", Role.DOCTOR);
        User patient1 = createUser("Rahul Sharma", "rahul.sharma@mediconnect.com", "Rahul@2026", Role.PATIENT);
        User patient2 = createUser("Neha Gupta", "neha.gupta@mediconnect.com", "Neha@2026", Role.PATIENT);
        User pharmacist = createUser("Priyanka Das", "priyanka.das@mediconnect.com", "Priyanka@2026", Role.PHARMACIST);

        admin.setPhone("+1 555-0100");
        doctor1.setPhone("+1 555-0101");
        doctor2.setPhone("+1 555-0102");
        doctor3.setPhone("+1 555-0103");
        doctor4.setPhone("+1 555-0106");
        doctor5.setPhone("+1 555-0107");
        doctor6.setPhone("+1 555-0109");
        doctor7.setPhone("+1 555-0110");
        doctor8.setPhone("+1 555-0111");
        patient1.setPhone("+1 555-0104");
        patient2.setPhone("+1 555-0105");
        pharmacist.setPhone("+1 555-0108");

        userRepository.save(admin);
        userRepository.save(doctor1);
        userRepository.save(doctor2);
        userRepository.save(doctor3);
        userRepository.save(doctor4);
        userRepository.save(doctor5);
        userRepository.save(doctor6);
        userRepository.save(doctor7);
        userRepository.save(doctor8);
        userRepository.save(patient1);
        userRepository.save(patient2);
        userRepository.save(pharmacist);

        doctorProfileRepository.save(createDoctorProfile(doctor1, "Cardiologist", "10 years", "New York", "United States", 150.0, 4.8, "https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor2, "Neurologist", "8 years", "New York", "United States", 180.0, 4.6, "https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor3, "Pediatrician", "9 years", "Boston", "United States", 140.0, 4.7, "https://images.pexels.com/photos/6749776/pexels-photo-6749776.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor4, "Dermatologist", "11 years", "Chicago", "United States", 160.0, 4.7, "https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor5, "Orthopedic Surgeon", "12 years", "San Francisco", "United States", 220.0, 4.9, "https://images.pexels.com/photos/7580250/pexels-photo-7580250.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor6, "Gynecologist", "7 years", "Seattle", "United States", 170.0, 4.5, "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor7, "Psychiatrist", "10 years", "Austin", "United States", 190.0, 4.8, "https://images.pexels.com/photos/6129688/pexels-photo-6129688.jpeg"));
        doctorProfileRepository.save(createDoctorProfile(doctor8, "ENT Specialist", "6 years", "Dallas", "United States", 145.0, 4.4, "https://images.pexels.com/photos/5998477/pexels-photo-5998477.jpeg"));

        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor1);
        appointment.setPatient(patient1);
        appointment.setDate(LocalDate.now().plusDays(1));
        appointment.setTime("10:00 AM");
        appointment.setType("Video");
        appointment.setSymptoms("Regular checkup for blood pressure monitoring");
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setMeetingLink("https://meet.jit.si/mediconnect-demo-room");
        appointment.setCreatedAt(LocalDateTime.now().minusDays(1));
        appointment = appointmentRepository.save(appointment);

        Prescription prescription = new Prescription();
        prescription.setAppointment(appointment);
        prescription.setPatient(patient1);
        prescription.setDoctor(doctor1);
        prescription.setDiagnosis("Hypertension");
        prescription.setNotes("Reduce salt intake and monitor BP daily");
        prescription.setMedicinesJson("[{\"name\":\"Losartan 50mg\",\"dosage\":\"1 tablet\",\"frequency\":\"Once daily\",\"duration\":\"30 days\"}]");
        prescription.setCreatedAt(LocalDateTime.now().minusHours(6));
        prescription = prescriptionRepository.save(prescription);

        MedicineOrder order = new MedicineOrder();
        order.setPrescription(prescription);
        order.setPatient(patient1);
        order.setMedicinesJson("[{\"name\":\"Losartan 50mg\",\"quantity\":30,\"price\":14.99}]");
        order.setTotalAmount(new BigDecimal("14.99"));
        order.setStatus(OrderStatus.PROCESSING);
        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setPaymentTransactionId("TXN-SEED-ORDER001");
        order.setPaymentMethod("UPI");
        order.setAddress("123 Main St, New York, NY 10001");
        order.setTrackingId("MC-SEED-001");
        order.setOrderDate(LocalDate.now());
        order.setCreatedAt(LocalDateTime.now().minusHours(2));
        medicineOrderRepository.save(order);

        doctorVerificationRepository.save(createDoctorVerification(doctor1));
        doctorVerificationRepository.save(createDoctorVerification(doctor2));
        doctorVerificationRepository.save(createDoctorVerification(doctor3));
        doctorVerificationRepository.save(createDoctorVerification(doctor4));
        doctorVerificationRepository.save(createDoctorVerification(doctor5));
        doctorVerificationRepository.save(createDoctorVerification(doctor6));
        doctorVerificationRepository.save(createDoctorVerification(doctor7));
        doctorVerificationRepository.save(createDoctorVerification(doctor8));

        ensureAdditionalInventory();

        labReportRepository.save(createLabReport(patient1, "Complete Blood Count (CBC)", "Blood Test", LocalDate.now().minusDays(3), "Dr. Ananya Rao", "City Diagnostics", "Completed", "{\"hemoglobin\":\"14.2 g/dL\",\"wbc\":\"7500 /uL\"}"));

        healthRecordRepository.save(createHealthRecord(patient1, "Diagnosis", "Hypertension Diagnosed", "Blood pressure consistently elevated. Started on medication.", LocalDate.now().minusMonths(9), "Dr. Ananya Rao"));

        notificationRepository.save(createNotification(patient1, "appointment", "Upcoming Appointment", "Your appointment with Dr. Ananya Rao is tomorrow at 10:00 AM", false, LocalDateTime.now().minusHours(8)));
        notificationRepository.save(createNotification(patient1, "order", "Order Placed", "Your medicine order #MC-SEED-001 has been placed", true, LocalDateTime.now().minusHours(2)));

        systemSettingRepository.save(createSetting("consultationFee", "100"));
        systemSettingRepository.save(createSetting("platformCommission", "10"));
        systemSettingRepository.save(createSetting("maintenanceMode", "false"));
        systemSettingRepository.save(createSetting("notificationsEnabled", "true"));
        systemSettingRepository.save(createSetting("autoApproveOrders", "false"));
        systemSettingRepository.save(createSetting("deliveryCharge", "5.99"));
        systemSettingRepository.save(createSetting("freeDeliveryThreshold", "50"));

        ensureAdditionalDoctors();
    }

    private void ensureAdditionalDoctors() {
        ensureDoctorExists(
                "Dr. Aisha Khan",
                "aisha.khan@mediconnect.com",
                "Aisha@2026",
                "+1 555-0112",
                "Endocrinologist",
                "9 years",
                "Los Angeles",
                "United States",
                200.0,
                4.7,
                "https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg"
        );

        ensureDoctorExists(
                "Dr. Ethan Brooks",
                "ethan.brooks@mediconnect.com",
                "Ethan@2026",
                "+1 555-0113",
                "Pulmonologist",
                "13 years",
                "Denver",
                "United States",
                210.0,
                4.8,
                "https://images.pexels.com/photos/5214957/pexels-photo-5214957.jpeg"
        );

        ensureDoctorExists(
                "Dr. Kavya Srinath",
                "kavya.srinath@mediconnect.com",
                "Kavya@2026",
                "+1 555-0114",
                "Rheumatologist",
                "8 years",
                "Houston",
                "United States",
                185.0,
                4.6,
                "https://images.pexels.com/photos/8376295/pexels-photo-8376295.jpeg"
        );

        ensureDoctorExists(
                "Dr. Mateo Alvarez",
                "mateo.alvarez@mediconnect.com",
                "Mateo@2026",
                "+1 555-0115",
                "Nephrologist",
                "11 years",
                "Miami",
                "United States",
                205.0,
                4.7,
                "https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg"
        );
    }

    private void ensureAdditionalInventory() {
        ensureInventoryItemExists("Paracetamol 500mg", "Pain Relief", 500, 100, "5.99", "tablets", "PharmaCorp", LocalDate.of(2027, 6, 15));
        ensureInventoryItemExists("Cetirizine 10mg", "Antihistamine", 200, 50, "8.99", "tablets", "MediSupply", LocalDate.of(2027, 8, 20));
        ensureInventoryItemExists("Vitamin C 1000mg", "Supplements", 350, 75, "12.99", "tablets", "VitaHealth", LocalDate.of(2027, 12, 1));

        ensureInventoryItemExists("Amoxicillin 500mg", "Antibiotics", 280, 60, "16.50", "capsules", "HealCore Labs", LocalDate.of(2027, 10, 10));
        ensureInventoryItemExists("Azithromycin 250mg", "Antibiotics", 190, 45, "22.00", "tablets", "MediNova", LocalDate.of(2027, 9, 5));
        ensureInventoryItemExists("Metformin 500mg", "Diabetes", 420, 90, "9.75", "tablets", "GlucoLife", LocalDate.of(2028, 2, 14));
        ensureInventoryItemExists("Telmisartan 40mg", "Cardiovascular", 310, 70, "18.40", "tablets", "Cardia Pharma", LocalDate.of(2027, 11, 22));
        ensureInventoryItemExists("Atorvastatin 10mg", "Cardiovascular", 260, 60, "14.30", "tablets", "Cardia Pharma", LocalDate.of(2028, 1, 18));
        ensureInventoryItemExists("Pantoprazole 40mg", "Gastric", 340, 80, "11.20", "tablets", "DigestWell", LocalDate.of(2027, 12, 12));
        ensureInventoryItemExists("ORS Sachet", "Hydration", 520, 120, "3.50", "sachets", "NutraAid", LocalDate.of(2028, 3, 1));
        ensureInventoryItemExists("Insulin Glargine Pen", "Diabetes", 120, 35, "215.00", "pens", "GlucoLife", LocalDate.of(2027, 7, 30));
        ensureInventoryItemExists("Salbutamol Inhaler", "Respiratory", 150, 40, "135.00", "inhalers", "AirCare", LocalDate.of(2027, 8, 8));
        ensureInventoryItemExists("Levocetirizine 5mg", "Antihistamine", 210, 55, "10.80", "tablets", "MediSupply", LocalDate.of(2027, 10, 28));
        ensureInventoryItemExists("Calcium + D3", "Supplements", 275, 65, "19.90", "tablets", "VitaHealth", LocalDate.of(2028, 4, 15));
        ensureInventoryItemExists("Ibuprofen 400mg", "Pain Relief", 240, 55, "7.60", "tablets", "PharmaCorp", LocalDate.of(2027, 9, 19));
        ensureInventoryItemExists("Cough Syrup DX", "Respiratory", 165, 45, "68.00", "bottles", "AirCare", LocalDate.of(2027, 6, 25));
    }

    private void ensureInventoryItemExists(String name,
                                           String category,
                                           Integer stock,
                                           Integer minStock,
                                           String price,
                                           String unit,
                                           String supplier,
                                           LocalDate expiry) {
        boolean exists = inventoryItemRepository.findAll().stream()
                .anyMatch(item -> item.getName() != null && item.getName().equalsIgnoreCase(name));

        if (!exists) {
            inventoryItemRepository.save(createInventory(name, category, stock, minStock, price, unit, supplier, expiry));
        }
    }

    private void ensureDoctorExists(String name,
                                    String email,
                                    String password,
                                    String phone,
                                    String specialization,
                                    String experience,
                                    String city,
                                    String country,
                                    Double fee,
                                    Double rating,
                                    String imageUrl) {
        User doctor = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (doctor == null) {
            doctor = createUser(name, email, password, Role.DOCTOR);
            doctor.setPhone(phone);
            doctor = userRepository.save(doctor);
        } else {
            boolean needsSave = false;

            if (doctor.getRole() != Role.DOCTOR) {
                doctor.setRole(Role.DOCTOR);
                needsSave = true;
            }

            if (doctor.getPhone() == null || doctor.getPhone().isBlank()) {
                doctor.setPhone(phone);
                needsSave = true;
            }

            if (needsSave) {
                doctor = userRepository.save(doctor);
            }
        }

        if (doctorProfileRepository.findByUserId(doctor.getId()).isEmpty()) {
            doctorProfileRepository.save(createDoctorProfile(
                    doctor,
                    specialization,
                    experience,
                    city,
                    country,
                    fee,
                    rating,
                    imageUrl
            ));
        }

        if (doctorVerificationRepository.findByDoctorId(doctor.getId()).isEmpty()) {
            doctorVerificationRepository.save(createDoctorVerification(doctor));
        }
    }

    private User createUser(String name, String email, String password, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setBlocked(false);
        return user;
    }

    private DoctorProfile createDoctorProfile(User user, String specialization, String experience, String city, String country, Double fee, Double rating, String imageUrl) {
        DoctorProfile profile = new DoctorProfile();
        profile.setUser(user);
        profile.setSpecialization(specialization);
        profile.setExperience(experience);
        profile.setCity(city);
        profile.setCountry(country);
        profile.setFee(fee);
        profile.setRating(rating);
        profile.setImageUrl(imageUrl);
        return profile;
    }

    private DoctorVerification createDoctorVerification(User doctor) {
        DoctorVerification v = new DoctorVerification();
        v.setDoctor(doctor);
        v.setStatus("Verified");
        v.setVerifiedAt(LocalDate.now().minusMonths(2));
        v.setDocumentsJson("[\"License\",\"Degree\",\"ID Proof\"]");
        return v;
    }

    private InventoryItem createInventory(String name, String category, Integer stock, Integer minStock, String price, String unit, String supplier, LocalDate expiry) {
        InventoryItem item = new InventoryItem();
        item.setName(name);
        item.setCategory(category);
        item.setStock(stock);
        item.setMinStock(minStock);
        item.setPrice(new BigDecimal(price));
        item.setUnit(unit);
        item.setSupplier(supplier);
        item.setExpiryDate(expiry);
        return item;
    }

    private LabReport createLabReport(User patient, String name, String type, LocalDate date, String doctor, String lab, String status, String resultsJson) {
        LabReport report = new LabReport();
        report.setPatient(patient);
        report.setName(name);
        report.setType(type);
        report.setDate(date);
        report.setDoctor(doctor);
        report.setLab(lab);
        report.setStatus(status);
        report.setResultsJson(resultsJson);
        report.setCreatedAt(LocalDateTime.now().minusDays(3));
        return report;
    }

    private HealthRecord createHealthRecord(User patient, String type, String title, String description, LocalDate date, String doctor) {
        HealthRecord record = new HealthRecord();
        record.setPatient(patient);
        record.setType(type);
        record.setTitle(title);
        record.setDescription(description);
        record.setDate(date);
        record.setDoctor(doctor);
        return record;
    }

    private Notification createNotification(User user, String type, String title, String message, boolean isRead, LocalDateTime createdAt) {
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(isRead);
        n.setCreatedAt(createdAt);
        return n;
    }

    private SystemSetting createSetting(String key, String value) {
        SystemSetting setting = new SystemSetting();
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        return setting;
    }
}
