# MediConnect Backend (Spring Boot for STS)

This backend is built for Spring Tool Suite (STS) and exposes REST APIs for your React frontend.

## Tech Stack

- Java 17
- Spring Boot 3
- Spring Web
- Spring Data JPA
- H2 in-memory database

## Open in STS

1. Open STS.
2. Go to `File -> Import -> Maven -> Existing Maven Projects`.
3. Select the `backend` folder.
4. Finish import.
5. Run `MediconnectBackendApplication` as a Spring Boot App.

The server starts on `http://localhost:8080`.

## Demo Logins

- Admin: `admin@mediconnect.com` / `Admin@2026`
- Doctor: `ananya.rao@mediconnect.com` / `Ananya@2026`
- Patient: `rahul.sharma@mediconnect.com` / `Rahul@2026`
- Pharmacist: `priyanka.das@mediconnect.com` / `Priyanka@2026`

## Main APIs

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Users and Doctors
- `GET /api/users`
- `GET /api/users/{id}`
- `GET /api/doctors`

### Appointments
- `POST /api/appointments`
- `GET /api/appointments/doctor/{doctorId}`
- `GET /api/appointments/patient/{patientId}`
- `PATCH /api/appointments/{id}/status`

### Prescriptions
- `POST /api/prescriptions`
- `GET /api/prescriptions/patient/{patientId}`
- `GET /api/prescriptions/doctor/{doctorId}`

### Orders
- `POST /api/orders`
- `PATCH /api/orders/{id}/status`
- `GET /api/orders/patient/{patientId}`
- `GET /api/orders`

### Notifications
- `GET /api/notifications/user/{userId}`
- `GET /api/notifications/user/{userId}/unread-count`
- `PATCH /api/notifications/{id}/read`

### Inventory
- `GET /api/inventory`
- `GET /api/inventory/low-stock`
- `POST /api/inventory`
- `PUT /api/inventory/{id}`

### Lab Reports
- `GET /api/lab-reports/patient/{patientId}`
- `POST /api/lab-reports`

### Health Records
- `GET /api/health-records/patient/{patientId}`
- `POST /api/health-records`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/doctor-verifications`
- `PATCH /api/admin/doctor-verifications/{doctorId}/verify`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `PATCH /api/admin/users/{userId}/toggle-block`

## H2 Console

- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:mediconnectdb`
- User: `sa`
- Password: (empty)

## Frontend Integration Hint

In your React app, replace in-memory context actions with API calls to `http://localhost:8080/api/...`.
Start by wiring:
- Login/Register
- Doctor list fetch
- Book appointment
- Prescription create/list
- Order create/status
- Notification list and unread count
- Inventory management
- Admin stats and settings
