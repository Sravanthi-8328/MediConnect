# 🗄️ MediConnect MySQL Commands Reference

## Database Connection
```bash
mysql -h localhost -u root -proot123 mediconnectdb
```

---

## 📊 DATABASE OVERVIEW

### Show all tables and row counts
```sql
SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA='mediconnectdb' ORDER BY TABLE_ROWS DESC;
```

### Show database size
```sql
SELECT CONCAT(ROUND(SUM(data_length+index_length)/1024/1024,2),' MB') AS size
FROM information_schema.TABLES WHERE table_schema='mediconnectdb';
```

---

## 👥 USERS TABLE

### View all users
```sql
SELECT id, name, email, role, phone, blocked, created_at FROM users;
```

### View users by role
```sql
SELECT id, name, email, role FROM users WHERE role = 'DOCTOR';
SELECT id, name, email, role FROM users WHERE role = 'PATIENT';
SELECT id, name, email, role FROM users WHERE role = 'PHARMACIST';
SELECT id, name, email, role FROM users WHERE role = 'ADMIN';
```

### Find user by email
```sql
SELECT * FROM users WHERE email = 'ananya.rao@mediconnect.com';
```

### Count users by role
```sql
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

### Create new user (INSERT)
```sql
INSERT INTO users (name, email, password, role, phone, blocked) 
VALUES ('New User', 'newuser@email.com', 'hashedpassword123', 'PATIENT', '9876543210', 0);
```

### Update user
```sql
UPDATE users SET phone = '9999999999' WHERE email = 'user@email.com';
UPDATE users SET blocked = 1 WHERE id = 5;
UPDATE users SET blocked = 0 WHERE id = 5;
```

### Delete user
```sql
DELETE FROM users WHERE id = 20;
```

---

## 👨‍⚕️ DOCTOR_PROFILES TABLE

### View all doctor profiles
```sql
SELECT 
    u.id, u.name, dp.specialization, dp.city, dp.fee, 
    dp.experience, dp.rating, dp.country
FROM doctor_profiles dp
JOIN users u ON dp.user_id = u.id;
```

### View doctors by specialization
```sql
SELECT u.name, dp.specialization, dp.fee, dp.rating 
FROM doctor_profiles dp
JOIN users u ON dp.user_id = u.id
WHERE dp.specialization = 'Cardiologist';
```

### View doctors in a city
```sql
SELECT u.name, dp.specialization, dp.city, dp.fee 
FROM doctor_profiles dp
JOIN users u ON dp.user_id = u.id
WHERE dp.city = 'New York';
```

### Top rated doctors
```sql
SELECT u.name, dp.specialization, dp.rating, dp.fee 
FROM doctor_profiles dp
JOIN users u ON dp.user_id = u.id
ORDER BY dp.rating DESC LIMIT 10;
```

### Update doctor profile
```sql
UPDATE doctor_profiles 
SET fee = 200, rating = 4.9 
WHERE user_id = 2;
```

### Update doctor payout info
```sql
UPDATE doctor_profiles 
SET payout_enabled = 1, payout_mode = 'UPI', payout_upi_id = 'doctor@upi' 
WHERE user_id = 2;
```

---

## 📅 APPOINTMENTS TABLE

### View all appointments
```sql
SELECT a.id, d.name AS doctor, p.name AS patient, a.date, a.time, a.type, a.status
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
ORDER BY a.date DESC;
```

### View pending appointments
```sql
SELECT a.id, d.name AS doctor, p.name AS patient, a.date, a.time, a.status
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
WHERE a.status = 'PENDING';
```

### View confirmed appointments
```sql
SELECT a.id, d.name AS doctor, p.name AS patient, a.date, a.time
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
WHERE a.status = 'CONFIRMED';
```

### View completed appointments
```sql
SELECT a.id, d.name AS doctor, p.name AS patient, a.date, a.diagnosis
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
WHERE a.status = 'COMPLETED';
```

### View rejected appointments
```sql
SELECT a.id, d.name AS doctor, p.name AS patient, a.rejection_reason
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
WHERE a.status = 'REJECTED';
```

### Appointments by doctor
```sql
SELECT a.id, p.name AS patient, a.date, a.time, a.status
FROM appointments a
JOIN users p ON a.patient_id = p.id
WHERE a.doctor_id = 2  -- Replace 2 with doctor ID
ORDER BY a.date DESC;
```

### Appointments by patient
```sql
SELECT a.id, d.name AS doctor, a.date, a.time, a.status
FROM appointments a
JOIN users d ON a.doctor_id = d.id
WHERE a.patient_id = 10  -- Replace 10 with patient ID
ORDER BY a.date DESC;
```

### Count appointments by status
```sql
SELECT status, COUNT(*) as count FROM appointments GROUP BY status;
```

### Accept appointment (doctor accepts)
```sql
UPDATE appointments SET status = 'CONFIRMED' WHERE id = 2;
```

### Reject appointment (doctor rejects)
```sql
UPDATE appointments SET status = 'REJECTED', rejection_reason = 'Not available' WHERE id = 3;
```

### Complete appointment
```sql
UPDATE appointments 
SET status = 'COMPLETED', diagnosis = 'Hypertension', notes = 'Reduce salt intake'
WHERE id = 1;
```

### Cancel appointment
```sql
UPDATE appointments SET status = 'CANCELLED' WHERE id = 5;
```

### Generate meeting link
```sql
UPDATE appointments 
SET meeting_link = 'https://meet.jit.si/mediconnect-doc2-pat10-abc123'
WHERE id = 1 AND type = 'Video';
```

### View video call meetings
```sql
SELECT a.id, d.name AS doctor, p.name AS patient, a.meeting_link
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
WHERE a.type = 'Video' AND a.meeting_link IS NOT NULL;
```

---

## 💊 PRESCRIPTIONS TABLE

### View all prescriptions
```sql
SELECT p.id, d.name AS doctor, pt.name AS patient, p.notes, p.created_at
FROM prescriptions p
JOIN users d ON p.doctor_id = d.id
JOIN users pt ON p.patient_id = pt.id;
```

### View prescriptions for a patient
```sql
SELECT p.id, d.name AS doctor, p.medicines_json, p.notes
FROM prescriptions p
JOIN users d ON p.doctor_id = d.id
WHERE p.patient_id = 10;
```

### View prescriptions by doctor
```sql
SELECT p.id, pt.name AS patient, p.medicines_json, p.diagnosis
FROM prescriptions p
JOIN users pt ON p.patient_id = pt.id
WHERE p.doctor_id = 2;
```

### Create prescription
```sql
INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medicines_json, notes, diagnosis)
VALUES (1, 10, 2, '[{"name":"Paracetamol","dosage":"500mg","frequency":"twice daily"}]', 'Rest and hydration', 'Common Cold');
```

### Update prescription
```sql
UPDATE prescriptions 
SET notes = 'Reduce dose after 5 days'
WHERE id = 1;
```

### Delete prescription
```sql
DELETE FROM prescriptions WHERE id = 1;
```

---

## 💊 MEDICINE_ORDERS TABLE

### View all medicine orders
```sql
SELECT o.id, pt.name AS patient, o.total_amount, o.status, o.order_date
FROM medicine_orders o
JOIN users pt ON o.patient_id = pt.id;
```

### View pending orders
```sql
SELECT o.id, pt.name AS patient, o.medicines_json, o.total_amount
FROM medicine_orders o
JOIN users pt ON o.patient_id = pt.id
WHERE o.status IN ('PROCESSING', 'PREPARING');
```

### View ready orders
```sql
SELECT o.id, pt.name AS patient, o.total_amount, o.address
FROM medicine_orders o
JOIN users pt ON o.patient_id = pt.id
WHERE o.status = 'READY';
```

### View delivered orders
```sql
SELECT o.id, pt.name AS patient, o.total_amount, o.delivery_date
FROM medicine_orders o
JOIN users pt ON o.patient_id = pt.id
WHERE o.status = 'DELIVERED';
```

### Create medicine order
```sql
INSERT INTO medicine_orders (prescription_id, patient_id, medicines_json, total_amount, status, address)
VALUES (1, 10, '[{"name":"Amoxicillin","quantity":2}]', 250.00, 'PROCESSING', '123 Main St, City');
```

### Update order status
```sql
UPDATE medicine_orders SET status = 'PREPARING' WHERE id = 1;
UPDATE medicine_orders SET status = 'READY' WHERE id = 1;
UPDATE medicine_orders SET status = 'DISPATCHED' WHERE id = 1;
UPDATE medicine_orders SET status = 'DELIVERED', delivery_date = NOW() WHERE id = 1;
```

---

## 📋 INVENTORY_ITEMS TABLE

### View all inventory
```sql
SELECT id, name, category, stock, min_stock, price, supplier
FROM inventory_items
ORDER BY stock DESC;
```

### View low stock items
```sql
SELECT id, name, stock, min_stock, category
FROM inventory_items
WHERE stock <= min_stock;
```

### View medicines by category
```sql
SELECT name, category, stock, price FROM inventory_items WHERE category = 'Antibiotics';
```

### Count inventory by category
```sql
SELECT category, COUNT(*) as count, SUM(stock) as total_stock
FROM inventory_items
GROUP BY category;
```

### Add new medicine to inventory
```sql
INSERT INTO inventory_items (name, category, stock, min_stock, price, unit, supplier, expiry_date)
VALUES ('New Medicine', 'Pain Relief', 500, 100, 15.99, 'tablets', 'Supplier Name', '2027-12-31');
```

### Update stock
```sql
UPDATE inventory_items SET stock = 250 WHERE id = 1;
UPDATE inventory_items SET stock = stock - 10 WHERE id = 1;  -- Reduce stock
UPDATE inventory_items SET stock = stock + 50 WHERE id = 1;  -- Increase stock
```

### Update medicine price
```sql
UPDATE inventory_items SET price = 19.99 WHERE id = 5;
```

### Delete medicine from inventory
```sql
DELETE FROM inventory_items WHERE id = 15;
```

---

## 📄 LAB_REPORTS TABLE

### View all lab reports
```sql
SELECT r.id, pt.name AS patient, r.name, r.type, r.date, r.status
FROM lab_reports r
JOIN users pt ON r.patient_id = pt.id;
```

### View lab reports for patient
```sql
SELECT id, name, type, date, results_json, file_url
FROM lab_reports
WHERE patient_id = 10;
```

### View uploaded reports
```sql
SELECT r.id, pt.name AS patient, r.name, r.file_url
FROM lab_reports r
JOIN users pt ON r.patient_id = pt.id
WHERE r.file_url IS NOT NULL;
```

### Create lab report
```sql
INSERT INTO lab_reports (patient_id, name, type, date, status)
VALUES (10, 'Blood Test Report', 'Blood Test', '2026-04-07', 'Uploaded');
```

### Delete lab report
```sql
DELETE FROM lab_reports WHERE id = 1;
```

---

## 🏥 HEALTH_RECORDS TABLE

### View all health records
```sql
SELECT r.id, pt.name AS patient, r.type, r.title, r.date
FROM health_records r
JOIN users pt ON r.patient_id = pt.id;
```

### View health records for patient
```sql
SELECT type, title, description, date
FROM health_records
WHERE patient_id = 10;
```

---

## 💳 PAYMENT_TRANSACTIONS TABLE

### View all payments
```sql
SELECT p.id, pt.name AS patient, p.amount, p.payment_method, p.status, p.created_at
FROM payment_transactions p
JOIN users pt ON p.patient_id = pt.id
ORDER BY p.created_at DESC;
```

### View successful payments
```sql
SELECT p.id, pt.name AS patient, p.amount, p.payment_method
FROM payment_transactions p
JOIN users pt ON p.patient_id = pt.id
WHERE p.status = 'SUCCESS';
```

### View failed payments
```sql
SELECT p.id, pt.name AS patient, p.amount, p.payment_method
FROM payment_transactions p
JOIN users pt ON p.patient_id = pt.id
WHERE p.status = 'FAILED';
```

### Total revenue
```sql
SELECT SUM(amount) as total_revenue 
FROM payment_transactions 
WHERE status = 'SUCCESS';
```

### Revenue by payment method
```sql
SELECT payment_method, COUNT(*) as count, SUM(amount) as total
FROM payment_transactions
WHERE status = 'SUCCESS'
GROUP BY payment_method;
```

### Revenue by doctor
```sql
SELECT d.name, SUM(p.amount) as total_revenue
FROM payment_transactions p
JOIN users d ON p.doctor_id = d.id
WHERE p.status = 'SUCCESS'
GROUP BY d.name
ORDER BY total_revenue DESC;
```

---

## 🔔 NOTIFICATIONS TABLE

### View all notifications
```sql
SELECT n.id, u.name AS user, n.type, n.title, n.is_read, n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC;
```

### View unread notifications
```sql
SELECT n.id, u.name AS user, n.title, n.message
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.is_read = 0;
```

### View notifications for user
```sql
SELECT id, title, message, type, is_read
FROM notifications
WHERE user_id = 10;
```

### Mark notification as read
```sql
UPDATE notifications SET is_read = 1 WHERE id = 1;
```

---

## doctor_verifications TABLE

### View all doctor verifications
```sql
SELECT dv.id, u.name, dv.status, dv.verified_at
FROM doctor_verifications dv
JOIN users u ON dv.doctor_user_id = u.id;
```

### View verified doctors
```sql
SELECT u.name, u.email
FROM doctor_verifications dv
JOIN users u ON dv.doctor_user_id = u.id
WHERE dv.status = 'Verified';
```

### View pending verifications
```sql
SELECT u.name, u.email, dv.documents_json
FROM doctor_verifications dv
JOIN users u ON dv.doctor_user_id = u.id
WHERE dv.status = 'Pending';
```

### Verify a doctor
```sql
UPDATE doctor_verifications SET status = 'Verified', verified_at = NOW()
WHERE doctor_user_id = 2;
```

---

## 🔍 ADVANCED QUERIES

### Dashboard Statistics
```sql
-- Total appointments today
SELECT COUNT(*) as today_appointments 
FROM appointments 
WHERE DATE(date) = CURDATE();

-- Total revenue today
SELECT SUM(amount) as total_revenue 
FROM payment_transactions 
WHERE DATE(created_at) = CURDATE() AND status = 'SUCCESS';

-- Most booked doctor
SELECT d.name, COUNT(a.id) as appointment_count
FROM appointments a
JOIN users d ON a.doctor_id = d.id
GROUP BY d.id
ORDER BY appointment_count DESC
LIMIT 5;

-- Patient with most appointments
SELECT pt.name, COUNT(a.id) as appointment_count
FROM appointments a
JOIN users pt ON a.patient_id = pt.id
GROUP BY pt.id
ORDER BY appointment_count DESC
LIMIT 5;

-- Specialization demand
SELECT dp.specialization, COUNT(a.id) as appointment_count
FROM appointments a
JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
GROUP BY dp.specialization
ORDER BY appointment_count DESC;
```

### Patient Summary
```sql
SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT pr.id) as total_prescriptions,
    SUM(pt.amount) as total_spent
FROM users p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN prescriptions pr ON p.id = pr.patient_id
LEFT JOIN payment_transactions pt ON p.id = pt.patient_id AND pt.status = 'SUCCESS'
WHERE p.role = 'PATIENT'
GROUP BY p.id;
```

### Doctor Performance
```sql
SELECT 
    d.name,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed,
    ROUND(AVG(dp.rating), 2) as avg_rating,
    COUNT(DISTINCT p.id) as unique_patients
FROM users d
LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
LEFT JOIN appointments a ON d.id = a.doctor_id
LEFT JOIN prescriptions pr ON d.id = pr.doctor_id
LEFT JOIN users p ON p.id = a.patient_id
WHERE d.role = 'DOCTOR'
GROUP BY d.id;
```

---

## 🧹 DATABASE MAINTENANCE

### Backup database
```bash
mysqldump -h localhost -u root -proot123 mediconnectdb > mediconnectdb_backup.sql
```

### Restore database
```bash
mysql -h localhost -u root -proot123 mediconnectdb < mediconnectdb_backup.sql
```

### Check database integrity
```sql
ANALYZE TABLE appointments;
ANALYZE TABLE users;
ANALYZE TABLE prescriptions;
REPAIR TABLE appointments;
```

### Show table structure
```sql
DESCRIBE users;
DESCRIBE appointments;
DESCRIBE prescriptions;
DESCRIBE inventory_items;
```

---

## 📝 QUICK REFERENCE

| Operation | Table | Command |
|-----------|-------|---------|
| **View All** | users | `SELECT * FROM users;` |
| **View All** | appointments | `SELECT * FROM appointments;` |
| **View All** | prescriptions | `SELECT * FROM prescriptions;` |
| **View All** | inventory_items | `SELECT * FROM inventory_items;` |
| **Pending** | appointments | `SELECT * FROM appointments WHERE status='PENDING';` |
| **Confirmed** | appointments | `SELECT * FROM appointments WHERE status='CONFIRMED';` |
| **Count** | users | `SELECT COUNT(*) FROM users;` |
| **Count** | appointments | `SELECT COUNT(*) FROM appointments;` |

---

## 🚀 Quick Copy-Paste Commands

```bash
# Connect to database
mysql -h localhost -u root -proot123 mediconnectdb

# Show all appointments
SELECT a.id, d.name AS doctor, p.name AS patient, a.date, a.time, a.status FROM appointments a JOIN users d ON a.doctor_id = d.id JOIN users p ON a.patient_id = p.id;

# Show all users
SELECT id, name, email, role FROM users;

# Show all doctors
SELECT u.id, u.name, dp.specialization, dp.fee FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id;

# Show pending appointments
SELECT a.id, d.name AS doctor, p.name AS patient, a.status FROM appointments a JOIN users d ON a.doctor_id = d.id JOIN users p ON a.patient_id = p.id WHERE a.status='PENDING';

# Accept appointment (doctor)
UPDATE appointments SET status='CONFIRMED' WHERE id=2;

# Reject appointment (doctor)
UPDATE appointments SET status='REJECTED' WHERE id=3;

# Show inventory
SELECT id, name, category, stock, price FROM inventory_items;

# Show payments
SELECT p.id, u.name, p.amount, p.status FROM payment_transactions p JOIN users u ON p.patient_id = u.id;

# Show total revenue
SELECT SUM(amount) as total FROM payment_transactions WHERE status='SUCCESS';
```
