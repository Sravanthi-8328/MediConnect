# 🏥 MediConnect - Complete FAQ & Solutions Guide

**Last Updated:** April 7, 2026  
**Project Stack:** React 18.2 + Spring Boot 3.3.4 + MySQL 8.0 + Jitsi Meet

---

## 📋 TABLE OF CONTENTS

1. [Setup & Installation](#setup--installation)
2. [Backend Configuration](#backend-configuration)
3. [Database Issues](#database-issues)
4. [Frontend Development](#frontend-development)
5. [Authentication & Authorization](#authentication--authorization)
6. [Video Calls & Jitsi Integration](#video-calls--jitsi-integration)
7. [Appointments & Workflow](#appointments--workflow)
8. [Payments & Razorpay](#payments--razorpay)
9. [Common Errors & Fixes](#common-errors--fixes)
10. [Performance & Optimization](#performance--optimization)

---

## SETUP & INSTALLATION

### Q1: How do I set up the entire project?

**A:** Follow these steps:

```bash
# 1. Clone repository (or extract project)
cd "Final"

# 2. Install frontend dependencies
npm install

# 3. Start MySQL database
# Make sure MySQL 8.0 is running on localhost:3306
# Database: mediconnectdb
# User: root
# Password: root123

# 4. Build and run backend
cd backend
mvn clean install
mvn spring-boot:run
# Backend runs on http://localhost:8080

# 5. Start frontend dev server (from root directory)
cd ..
npm run dev
# Frontend runs on http://localhost:5173
```

---

### Q2: What are the system requirements?

**A:** Minimum requirements:

| Component | Requirement |
|-----------|------------|
| **Java** | JDK 17+ |
| **Node.js** | v16+ (recommend v18+) |
| **MySQL** | 8.0+ |
| **RAM** | 4GB minimum |
| **Disk Space** | 2GB available |
| **Windows/Mac/Linux** | All supported |

**Check versions:**
```bash
java -version
node -v
npm -v
mysql --version
```

---

### Q3: How do I install MySQL?

**A:** Windows installation:

1. Download MySQL 8.0 from: https://dev.mysql.com/downloads/mysql/
2. Run installer and follow setup wizard
3. Choose "Developer Default" installation
4. Configure port as 3306
5. Create MySQL user:
   - Username: `root`
   - Password: `root123`
6. Start MySQL service

**Verify installation:**
```bash
mysql -h localhost -u root -proot123 -e "SELECT VERSION();"
```

---

### Q4: npm run dev shows "Exit Code 1" - how to fix?

**A:** This is a build/cache issue. Fix it:

```bash
# Option 1: Clean cache and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev

# Option 2: Clear Vite cache
rm -r .vite
npm run dev

# Option 3: Port already in use
# Kill process on port 5173 and retry
netstat -ano | findstr :5173  # Windows
lsof -i :5173                  # Mac/Linux
```

---

### Q5: How do I build for production?

**A:**

```bash
# Frontend build
npm run build
# Creates optimized build in dist/ folder
# File: dist/index.html

# Backend build (already done in mvn install)
cd backend
mvn clean package
# Creates: target/mediconnect-backend-0.0.1-SNAPSHOT.jar
```

---

## BACKEND CONFIGURATION

### Q6: Backend throwing "Request failed" - what's wrong?

**A:** Backend is not running. Check:

```bash
# 1. Verify backend is running
netstat -ano | findstr :8080

# 2. If not running, start it
cd backend
mvn spring-boot:run

# 3. Test connection
curl http://localhost:8080/api/users

# 4. If frontend can't reach backend, check vite.config.js proxy
```

**vite.config.js should have:**
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
},
```

---

### Q7: How do I change the backend port?

**A:** Edit [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties):

```properties
server.port=8080  # Change to any port (e.g., 9000)
```

Then update [vite.config.js](vite.config.js) proxy target.

---

### Q8: CORS errors when calling API from frontend?

**A:** Check [backend/src/main/java/com/mediconnect/backend/config/CorsConfig.java](backend/src/main/java/com/mediconnect/backend/config/CorsConfig.java):

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173", "http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

Add your frontend URL to `allowedOrigins`.

---

### Q9: How do I modify API endpoints?

**A:** Endpoints are in `backend/src/main/java/com/mediconnect/backend/controller/`.

**Example - Add new endpoint:**

1. Open [backend/src/main/java/com/mediconnect/backend/controller/UserController.java](backend/src/main/java/com/mediconnect/backend/controller/UserController.java)
2. Add method:
```java
@PostMapping("/api/users/search")
public ResponseEntity<?> searchUsers(@RequestBody SearchRequest request) {
    // Implementation
    return ResponseEntity.ok(result);
}
```
3. Restart backend: `mvn spring-boot:run`

---

### Q10: How do I enable/disable endpoints?

**A:** Use Spring Security in [GlobalExceptionHandler.java](backend/src/main/java/com/mediconnect/backend/config/GlobalExceptionHandler.java) or add `@EnableWebSecurity` annotations.

---

## DATABASE ISSUES

### Q11: MySQL connection fails with "Access denied"?

**A:**

```bash
# 1. Verify MySQL is running
mysql -h localhost -u root -proot123

# 2. If access denied, reset password
# Windows: Use MySQL 8.0 Command Line Client
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root123';
FLUSH PRIVILEGES;

# 3. Update application.properties
spring.datasource.username=root
spring.datasource.password=root123
spring.datasource.url=jdbc:mysql://localhost:3306/mediconnectdb
```

---

### Q12: "Table not found" error?

**A:** Database tables don't exist. Create them:

```bash
# Option 1: Let Hibernate create tables (recommended)
# In application.properties: spring.jpa.hibernate.ddl-auto=create-drop

# Option 2: Run SQL dump
# If you have database dump file:
mysql -u root -proot123 mediconnectdb < dump.sql

# Option 3: Manually create tables
mysql -u root -proot123 mediconnectdb
# Then run CREATE TABLE statements
```

---

### Q13: How do I backup the database?

**A:**

```bash
# Backup
mysqldump -u root -proot123 mediconnectdb > backup.sql

# Restore
mysql -u root -proot123 mediconnectdb < backup.sql

# Backup specific table
mysqldump -u root -proot123 mediconnectdb users > users_backup.sql
```

---

### Q14: How do I view all database tables?

**A:**

```sql
-- Show all tables
SHOW TABLES;

-- Show table structure
DESCRIBE users;
DESCRIBE appointments;
DESCRIBE doctor_profiles;

-- Show table row count
SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA='mediconnectdb';

-- Show database size
SELECT CONCAT(ROUND(SUM(data_length+index_length)/1024/1024,2),' MB') AS size
FROM information_schema.TABLES WHERE table_schema='mediconnectdb';
```

---

### Q15: How do I reset/clear all data?

**A:** ⚠️ WARNING - This deletes all data!

```bash
# Option 1: Drop and recreate database
mysql -u root -proot123 -e "DROP DATABASE mediconnectdb; CREATE DATABASE mediconnectdb;"

# Option 2: Delete all records (keep structure)
mysql -u root -proot123 mediconnectdb << EOF
DELETE FROM notifications;
DELETE FROM health_records;
DELETE FROM lab_reports;
DELETE FROM prescriptions;
DELETE FROM medicine_orders;
DELETE FROM payment_transactions;
DELETE FROM appointments;
DELETE FROM doctor_profiles;
DELETE FROM users;
EOF
```

---

## FRONTEND DEVELOPMENT

### Q16: How do I add a new page?

**A:**

1. Create file: `src/pages/NewPage.jsx`
2. Add component:
```jsx
import React from 'react';

export default function NewPage() {
  return (
    <div className="page-container">
      <h1>New Page</h1>
    </div>
  );
}
```

3. Add route in `src/App.jsx`:
```jsx
import NewPage from './pages/NewPage';

// In routes array
{ path: '/new-page', element: <NewPage /> }
```

---

### Q17: How do I add a new component?

**A:**

1. Create file: `src/components/MyComponent.jsx`
2. Add component:
```jsx
import React from 'react';

export default function MyComponent({ prop1, prop2 }) {
  return <div>{prop1} {prop2}</div>;
}
```

3. Import and use:
```jsx
import MyComponent from '../components/MyComponent';

<MyComponent prop1="value1" prop2="value2" />
```

---

### Q18: How do I add styling?

**A:** Edit `src/styles/index.css`:

```css
.my-class {
  background-color: #0f766e;
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
}

/* Using CSS variables */
.button-primary {
  background: var(--primary-color, #0f766e);
  color: var(--text-light, white);
}
```

---

### Q19: How do I access global context data?

**A:** Use `AppContext` in any component:

```jsx
import { useContext } from 'react';
import AppContext from '../context/AppContext';

export default function MyComponent() {
  const { user, appointments, bookAppointment } = useContext(AppContext);
  
  return (
    <div>
      <p>User: {user?.name}</p>
      <button onClick={() => bookAppointment(doctorId, appointmentData)}>
        Book
      </button>
    </div>
  );
}
```

Available in `AppContext`:
- `user` - Current logged-in user
- `appointments` - User's appointments
- `doctors` - All doctors
- `bookAppointment()`, `acceptAppointment()`, `rejectAppointment()`, etc.

---

### Q20: How do I change language?

**A:** MediConnect has language context:

```jsx
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export default function MyComponent() {
  const { language, setLanguage } = useContext(LanguageContext);
  
  return (
    <button onClick={() => setLanguage('es')}>
      Switch to Spanish
    </button>
  );
}
```

---

## AUTHENTICATION & AUTHORIZATION

### Q21: How do I register a new user?

**A:**

**API:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "PATIENT"
}

# Roles: PATIENT, DOCTOR, PHARMACIST, ADMIN
```

**Frontend:**
```jsx
const { register } = useContext(AppContext);
register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  phone: '9876543210',
  role: 'PATIENT'
});
```

---

### Q22: How do I login?

**A:**

**API:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

# Response includes JWT token and user details
```

**Frontend:**
```jsx
const { login } = useContext(AppContext);
const response = await login(email, password);
// Token automatically saved to localStorage
```

---

### Q23: How do I logout?

**A:**

```jsx
const { logout } = useContext(AppContext);
logout(); // Clears user, removes token from localStorage
```

---

### Q24: What are user roles and permissions?

**A:**

| Role | Can Do |
|------|--------|
| **ADMIN** | View all users, approve doctors, manage system, view analytics |
| **DOCTOR** | View appointments, accept/reject, create prescriptions, view patients |
| **PATIENT** | Book appointments, view health records, order medicines, join video calls |
| **PHARMACIST** | Manage inventory, process medicine orders, view prescriptions |

**Check user role:**
```jsx
const { user } = useContext(AppContext);
if (user?.role === 'DOCTOR') {
  // Show doctor features
}
```

---

### Q25: How do I protect routes based on role?

**A:** Create protected route component:

```jsx
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import AppContext from '../context/AppContext';

export default function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useContext(AppContext);
  
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return element;
}

// Usage in App.jsx
<ProtectedRoute 
  element={<DoctorDashboard />} 
  allowedRoles={['DOCTOR']} 
/>
```

---

## VIDEO CALLS & JITSI INTEGRATION

### Q26: How do I enable video calls?

**A:** Video calls are already integrated! To join a video call:

1. **From Patient Dashboard:**
   - Navigate to "Upcoming Appointments"
   - Click "Join Call" button
   - Meeting link automatically opens in Jitsi

2. **Requirements:**
   - Appointment must be type "Video"
   - Status must be: PENDING, CONFIRMED, ACCEPTED, or RESCHEDULED
   - Jitsi (meet.jit.si) must be accessible

---

### Q27: Why doesn't "Join Call" button appear?

**A:**

Check these conditions in [src/pages/PatientDashboard.jsx](src/pages/PatientDashboard.jsx):

```jsx
const canJoinCall = (appointment) => {
  const status = (appointment?.status || '').trim().toLowerCase();
  return ['pending', 'confirmed', 'accepted', 'rescheduled'].includes(status);
};
```

**Fix:** Appointment must have:
- ✅ Type: "Video" (case-insensitive)
- ✅ Status: pending/confirmed/accepted/rescheduled
- ✅ Date/time: Should be upcoming
- ✅ Meeting link generated

---

### Q28: How do I change the Jitsi server?

**A:** Jitsi server is configured in [backend/src/main/java/com/mediconnect/backend/service/AppointmentService.java](backend/src/main/java/com/mediconnect/backend/service/AppointmentService.java):

```java
private String buildJitsiMeetingLink(Long doctorId, Long patientId) {
    String roomName = "mediconnect-doc" + doctorId + "-pat" + patientId + "-" + UUID.randomUUID();
    return "https://meet.jit.si/" + roomName;  // Change server here
}
```

**Alternative servers:**
- `https://meet.jit.si/` (Default - public Jitsi)
- Self-hosted Jitsi: `https://your-jitsi-server.com/`

---

### Q29: Video call not starting - what to check?

**A:**

1. **Check network:** Jitsi requires internet connection
2. **Check browser:** Update Chrome/Firefox to latest
3. **Check permissions:** Allow microphone/camera access
4. **Check meeting link** generates: Backend must be running
5. **Test directly:** Open https://meet.jit.si/test-room in browser
6. **Check firewall:** Jitsi uses ports 443 (HTTPS) and 10000-20000 (UDP)

---

### Q30: How do I customize video call interface?

**A:** Jitsi is embedded modal in PatientDashboard. Customize in:

```jsx
// src/pages/PatientDashboard.jsx around line 1800

showVideoModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <iframe
        src={meetingLink}
        // Add custom parameters here
        allow="camera; microphone; display-capture"
        style={{ width: '100%', height: '100vh' }}
      />
    </div>
  </div>
)
```

---

## APPOINTMENTS & WORKFLOW

### Q31: How do I create an appointment?

**A:**

**From Frontend:**
```jsx
const { bookAppointment } = useContext(AppContext);

await bookAppointment({
  doctorId: 2,
  patientId: 10,
  date: '2026-04-15',
  time: '14:30',
  type: 'Video',  // or 'Clinic'
  reason: 'General checkup'
});
```

**From API:**
```bash
POST /api/appointments/book
Content-Type: application/json

{
  "doctorId": 2,
  "patientId": 10,
  "date": "2026-04-15",
  "time": "14:30",
  "type": "Video",
  "reason": "General checkup"
}
```

**Status after creation:** PENDING

---

### Q32: What's the appointment workflow?

**A:**

```
┌─────────────┐
│   PENDING   │ ← Patient books appointment
└─────────────┘
       │
       ├─→ ✓ Doctor accepts ─→ ┌──────────────┐
       │                        │  CONFIRMED   │
       │                        └──────────────┘
       │                                │
       │                                ├─→ ✓ Mark complete ─→ ┌───────────┐
       │                                │                       │ COMPLETED │
       │                                │                       └───────────┘
       │                                │
       │                                └─→ ✗ Cancel ─→ ┌───────────┐
       │                                                 │ CANCELLED │
       │                                                 └───────────┘
       │
       └─→ ✗ Doctor rejects ─→ ┌──────────────┐
                                │   REJECTED   │
                                └──────────────┘
```

**Statuses:** PENDING, CONFIRMED, REJECTED, COMPLETED, CANCELLED, RESCHEDULED

---

### Q33: How do I accept/reject appointment as doctor?

**A:**

**From Frontend (Doctor Dashboard):**
```jsx
// Accept appointment
const handleAccept = (appointmentId) => {
  acceptAppointment(appointmentId);
};

// Reject appointment
const handleReject = (appointmentId) => {
  const reason = prompt('Enter rejection reason:');
  rejectAppointment(appointmentId, reason);
};
```

**From Database (MySQL):**
```sql
-- Accept
UPDATE appointments SET status = 'CONFIRMED' WHERE id = 2;

-- Reject
UPDATE appointments SET status = 'REJECTED', rejection_reason = 'Not available' WHERE id = 3;
```

**UI Location:** Doctor Dashboard → ⏳ Pending tab → Click ✓ or ✕

---

### Q34: Can clinic appointments have video calls?

**A:** Yes! Both Video and Clinic appointments can have meeting links.

**Updated Feature:**
```java
// Backend AppointmentService.java
public String getOrCreateMeetingLink(Long appointmentId) {
    // NOW works for ANY type (Video or Clinic)
    // No type restrictions
}
```

So doctors can start Jitsi calls from clinic appointments too.

---

### Q35: How do I view appointment details?

**A:**

**From Frontend:**
```jsx
const { appointments } = useContext(AppContext);
const appointment = appointments.find(a => a.id === 2);
console.log(appointment);
// { id, doctorId, patientId, date, time, type, status, meetingLink, ... }
```

**From Database:**
```sql
SELECT * FROM appointments WHERE id = 2;

SELECT a.id, d.name AS doctor, p.name AS patient, a.date, a.time, a.type, a.status
FROM appointments a
JOIN users d ON a.doctor_id = d.id
JOIN users p ON a.patient_id = p.id
WHERE a.id = 2;
```

---

## PAYMENTS & RAZORPAY

### Q36: How do I process payments?

**A:**

**From Frontend (already integrated):**
```jsx
const { processPayment } = useContext(AppContext);

await processPayment({
  appointmentId: 2,
  amount: 500,
  paymentMethod: 'UPI',  // or 'CARD'
  upiId: 'user@upi'
});
```

**Razorpay Integration:**
- Mode: DEMO (test mode)
- Test UPI: `success@razorpay`, `failed@razorpay`
- Test Cards: Visa, Mastercard available in Razorpay dashboard

---

### Q37: What payment methods are supported?

**A:**

| Method | Status |
|--------|--------|
| **UPI** | ✅ Enabled (GPay, PhonePe, BHIM) |
| **Credit Card** | ✅ Enabled (Visa, Mastercard) |
| **Debit Card** | ✅ Enabled (Visa, Mastercard) |
| **Wallet** | ✅ Enabled (Paytm, Amazon Pay) |

---

### Q38: How do I test payments?

**A:** In DEMO mode, use test credentials:

```
UPI Testing:
- Success: success@razorpay
- Failed: failed@razorpay

Card Testing:
- Card: 4111 1111 1111 1111
- Expiry: 12/25
- CVV: 123
```

---

### Q39: How do I enable LIVE payments?

**A:** In [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties):

```properties
# Change from TEST to LIVE
razorpay.mode=LIVE
razorpay.key_id=YOUR_LIVE_KEY_ID
razorpay.key_secret=YOUR_LIVE_KEY_SECRET
```

Get keys from: https://dashboard.razorpay.com/app/settings/api-keys

---

### Q40: How do I view payment history?

**A:**

**From Frontend:**
```jsx
const { payments } = useContext(AppContext);
payments.forEach(p => {
  console.log(`₹${p.amount} - ${p.status} via ${p.paymentMethod}`);
});
```

**From Database:**
```sql
SELECT id, appointment_id, amount, payment_method, status, transaction_id, created_at
FROM payment_transactions
ORDER BY created_at DESC;

-- View successful payments
SELECT SUM(amount) as total_revenue FROM payment_transactions WHERE status = 'SUCCESS';
```

---

## COMMON ERRORS & FIXES

### Q41: "TypeError: Cannot read property 'map' of undefined"

**A:** Data not loaded yet. Add null check:

```jsx
// ❌ Wrong
{appointments.map(a => <AppointmentCard key={a.id} appointment={a} />)}

// ✅ Correct
{appointments && appointments.length > 0 ? (
  appointments.map(a => <AppointmentCard key={a.id} appointment={a} />)
) : (
  <p>No appointments</p>
)}

// Or use optional chaining
{appointments?.map(a => <AppointmentCard key={a.id} appointment={a} />)}
```

---

### Q42: "Network Error: ECONNREFUSED"

**A:** Backend not running:

```bash
# Check if backend is running
netstat -ano | findstr :8080

# If not, start it
cd backend
mvn spring-boot:run

# Wait for "Started MediconnectBackendApplication" message
```

---

### Q43: "SyntaxError: Unexpected token }"

**A:** JavaScript syntax error. Check:

1. Balanced braces `{}`, brackets `[]`, parentheses `()`
2. Missing commas in objects/arrays
3. Missing semicolons (optional but recommended)

```jsx
// ❌ Wrong
const obj = { name: 'John' value: 'test' };

// ✅ Correct
const obj = { name: 'John', value: 'test' };
```

---

### Q44: "Cannot find module 'axios'"

**A:** Package not installed:

```bash
npm install axios
# Or reinstall all packages
npm install
```

---

### Q45: "CORS error: Access-Control-Allow-Origin"

**A:** CORS not configured. Check [backend/src/main/java/com/mediconnect/backend/config/CorsConfig.java](backend/src/main/java/com/mediconnect/backend/config/CorsConfig.java):

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

Make sure your frontend URL is in `allowedOrigins`.

---

### Q46: Button click not working

**A:** Check event handler:

```jsx
// ❌ Wrong - calls function immediately
<button onClick={handleClick()}>Click me</button>

// ✅ Correct - passes function reference
<button onClick={handleClick}>Click me</button>

// ✅ Correct - passes function with parameters
<button onClick={() => handleClick(id)}>Click me</button>
```

---

### Q47: State not updating after action

**A:** State is immutable. Create new object:

```jsx
// ❌ Wrong - mutating state directly
user.name = 'New Name';
setUser(user);

// ✅ Correct - create new object
setUser({ ...user, name: 'New Name' });

// ✅ Correct - for arrays
setAppointments([...appointments, newAppointment]);
```

---

### Q48: Form inputs not updating

**A:** Missing onChange handler:

```jsx
// ❌ Wrong
<input type="text" value={name} />

// ✅ Correct
<input 
  type="text" 
  value={name} 
  onChange={(e) => setName(e.target.value)} 
/>
```

---

### Q49: Image/CSS not loading

**A:** Wrong path. Fix:

```jsx
// ❌ Wrong
<img src="image.png" /> // Looks in public/
<link rel="stylesheet" href="styles.css" /> // Looks in root

// ✅ Correct - import in component
import image from '../assets/image.png';
<img src={image} />

// ✅ Correct - CSS in style tag or css file
import '../styles/index.css';
```

---

### Q50: "Port already in use" error

**A:** Another process using the port:

```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process (get PID from above)
taskkill /PID 1234 /F

# Or use different port
npm run dev -- --port 3000
```

---

## PERFORMANCE & OPTIMIZATION

### Q51: How do I improve load time?

**A:**

```javascript
// 1. Lazy load components
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));

// 2. Use React.memo for expensive components
const AppointmentCard = React.memo(({ appointment }) => {
  return <div>{appointment.date}</div>;
});

// 3. Optimize database queries
SELECT id, name, email FROM users; // ✅ Only needed columns
SELECT * FROM users; // ❌ Unnecessary columns

// 4. Implement pagination
SELECT * FROM appointments LIMIT 10 OFFSET 0; // Fetch 10 at a time
```

---

### Q52: Database queries running slow

**A:** Add indexes:

```sql
-- Create indexes on frequently queried columns
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_appointment_status ON appointments(status);
CREATE INDEX idx_appointment_doctor ON appointments(doctor_id);

-- View query performance
EXPLAIN SELECT * FROM appointments WHERE doctor_id = 2;
```

---

### Q53: Frontend bundle too large

**A:** Check bundle size:

```bash
npm run build
# Check dist/ folder size

# Optimize:
# 1. Remove unused packages
npm ls
npm prune

# 2. Enable gzip compression in vite.config.js
# 3. Code splitting with lazy loading (see Q51)
```

---

### Q54: Too many API calls - causing slowness

**A:** Implement caching:

```jsx
// Cache API response
const [cachedDoctors, setCachedDoctors] = useState(null);

useEffect(() => {
  if (cachedDoctors) return; // Use cached data
  
  fetchDoctors().then(data => {
    setCachedDoctors(data);
  });
}, []);
```

---

### Q55: Backend memory usage high

**A:** Check and optimize:

```bash
# Monitor Java process
jps -l # List Java processes
jconsole # GUI memory monitor

# In application.properties, limit memory
# JVM_OPTS="-Xmx512m -Xms256m"

# Otherwise:
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m"
```

---

## ADVANCED TOPICS

### Q56: How do I add email notifications?

**A:**

```java
// Install dependency in pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

// In application.properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

// Create EmailService.java
@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}
```

---

### Q57: How do I add SMS notifications?

**A:** Use Twilio:

```java
// pom.xml
<dependency>
    <groupId>com.twilio.sdk</groupId>
    <artifactId>twilio</artifactId>
    <version>9.0.0</version>
</dependency>

// SMS Service
@Service
public class SmsService {
    public void sendSms(String phoneNumber, String message) {
        Twilio.init("YOUR_ACCOUNT_SID", "YOUR_AUTH_TOKEN");
        
        Message msg = Message.creator(
            new PhoneNumber("+1234567890"),  // From number
            new PhoneNumber(phoneNumber),     // To number
            message
        ).create();
    }
}
```

---

### Q58: How do I implement push notifications?

**A:** Use Firebase Cloud Messaging:

```javascript
// frontend: src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  const token = await getToken(messaging, {
    vapidKey: 'YOUR_VAPID_KEY'
  });
  return token;
}
```

---

### Q59: How do I add analytics?

**A:** Use Google Analytics or Mixpanel:

```jsx
// src/utils/analytics.js
import ReactGA from 'react-ga4';

ReactGA.initialize('YOUR_GOOGLE_ANALYTICS_ID');

// Track page views
ReactGA.pageView(window.location.pathname);

// Track events
ReactGA.event({
  category: 'Appointments',
  action: 'Book',
  label: 'Video Call'
});
```

---

### Q60: How do I enable two-factor authentication?

**A:**

```java
// Use TOTP (Time-based One-Time Password)
// dependency: org.jboss.aerogear:aerogear-otp-java

@Service
public class TwoFactorService {
    public String generateSecret() {
        Totp totp = new Totp("MediConnect");
        return totp.getSecret();
    }
    
    public boolean verifyCode(String secret, String code) {
        Totp totp = new Totp(secret);
        return totp.verify(code);
    }
}
```

---

## DEPLOYMENT

### Q61: How do I deploy to production?

**A:**

**Frontend (Vercel - Recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Backend (AWS EC2):**
```bash
# Build JAR
mvn clean package

# Upload JAR to EC2
scp target/mediconnect-backend-0.0.1-SNAPSHOT.jar ec2-user@your-ip:/home/ec2-user/

# Run on server
java -jar mediconnect-backend-0.0.1-SNAPSHOT.jar
```

**Database (AWS RDS):**
```bash
# Create RDS MySQL instance
# Update application.properties with RDS endpoint
spring.datasource.url=jdbc:mysql://rds-endpoint:3306/mediconnectdb
```

---

### Q62: How do I set environment variables?

**A:**

**Frontend (.env file):**
```
VITE_API_URL=https://api.mediconnect.com
VITE_JITSI_URL=https://meet.jit.si
```

**Use in code:**
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Backend (application.properties):**
```properties
# Or use environment variables
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
razorpay.key_id=${RAZORPAY_KEY}
```

---

### Q63: How do I enable HTTPS?

**A:**

**Frontend:** Vercel/Netlify auto-enables HTTPS

**Backend:**
```properties
# In application.properties
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=your-password
server.ssl.key-store-type=PKCS12
```

**Or use Let's Encrypt on server:**
```bash
sudo certbot certonly --standalone -d mediconnect.com
```

---

## TROUBLESHOOTING CHECKLIST

### Quick Diagnosis Checklist:

- [ ] **Backend running?** `netstat -ano | findstr :8080`
- [ ] **MySQL running?** `mysql -u root -proot123 mediconnectdb`
- [ ] **Node modules installed?** `npm install`
- [ ] **Firewall blocking?** Check ports 5173, 8080, 3306
- [ ] **Environment variables set?** Check `.env` files
- [ ] **Browser cached?** Clear cache and reload
- [ ] **Console errors?** Open DevTools (F12) and check console
- [ ] **Network tab errors?** Check API response status codes
- [ ] **Database connection?** Test with MySQL CLI directly
- [ ] **CORS enabled?** Check backend CorsConfig.java

---

## QUICK COMMAND REFERENCE

```bash
# Start everything
cd backend && mvn spring-boot:run &
cd .. && npm run dev

# Check status
netstat -ano | findstr :5173  # Frontend
netstat -ano | findstr :8080  # Backend
netstat -ano | findstr :3306  # MySQL

# Database operations
mysql -u root -proot123 mediconnectdb
SHOW TABLES;
DESC users;
SELECT COUNT(*) FROM users;

# Build and deploy
npm run build
mvn clean package

# Kill process on port
taskkill /PID [PID] /F

# Check logs
# Frontend: Check browser console (F12)
# Backend: Check terminal output where mvn runs
# MySQL: Windows Event Viewer
```

---

## SUPPORT & RESOURCES

- **Documentation:** See README.md
- **MySQL Reference:** See MYSQL_COMMANDS.md
- **Spring Boot Docs:** https://spring.io/projects/spring-boot
- **React Docs:** https://react.dev
- **Jitsi API:** https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe
- **Razorpay API:** https://razorpay.com/docs/

---

**Document Version:** 1.0  
**Last Updated:** April 7, 2026  
**Maintained by:** MediConnect Development Team
