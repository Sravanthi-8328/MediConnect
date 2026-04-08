# 🏥 MediConnect - Medical Management System

A complete frontend-only React application for managing medical appointments, prescriptions, and medicine orders.

## 📋 Project Overview

MediConnect is a comprehensive healthcare management system built with React, featuring role-based dashboards for Admins, Doctors, Patients, and Pharmacists. The system manages:

- **Appointments**: Patients can book appointments with doctors
- **Prescriptions**: Doctors can create prescriptions for accepted appointments
- **Medicine Orders**: Pharmacists can manage medicine orders from prescriptions
- **User Management**: Admins can view and manage all system users

## 🎯 Features

### Patient Features
- ✅ View available doctors with specializations
- ✅ Book appointments by selecting doctor and date
- ✅ Track appointment status (Requested, Accepted, Completed, Rejected)
- ✅ View prescribed medicines from doctors
- ✅ Track medicine order status (Preparing, Ready, Delivered)

### Doctor Features
- ✅ View pending appointment requests
- ✅ Accept or reject appointments
- ✅ Add prescriptions for accepted appointments
- ✅ View all appointments (accepted and completed)

### Pharmacist Features
- ✅ View all available prescriptions
- ✅ Create medicine orders from prescriptions
- ✅ Update order status (Preparing → Ready → Delivered)
- ✅ Track patient information for orders

### Admin Features
- ✅ View all system users (grouped by role)
- ✅ Monitor all appointments with details
- ✅ View system statistics and reports
- ✅ Track appointment approval rates

## 📁 Project Structure

```
MediConnect/
├── src/
│   ├── App.jsx                      # Main app with routing
│   ├── main.jsx                     # React entry point
│   ├── context/
│   │   └── AppContext.jsx           # Global state management
│   ├── pages/
│   │   ├── Login.jsx                # Login page
│   │   ├── AdminDashboard.jsx       # Admin dashboard
│   │   ├── DoctorDashboard.jsx      # Doctor dashboard
│   │   ├── PatientDashboard.jsx     # Patient dashboard
│   │   └── PharmacistDashboard.jsx  # Pharmacist dashboard
│   ├── components/
│   │   ├── Navbar.jsx               # Navigation bar
│   │   ├── Sidebar.jsx              # Sidebar menu
│   │   ├── AppointmentCard.jsx      # Appointment card component
│   │   └── PrescriptionCard.jsx     # Prescription card component
│   └── styles/
│       └── index.css                # Global styles
├── index.html                       # HTML template
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
└── .gitignore                       # Git ignore file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

## 🔐 Demo Users

The application comes with pre-configured demo users for testing:

### Admin
- **Name**: Admin User
- **Role**: Admin

### Doctors
- **Name**: Dr. Ananya Rao (Cardiologist)
- **Name**: Dr. Arjun Menon (Neurologist)
- **Name**: Dr. Meera Iyer (Pediatrician)

### Patients
- **Name**: Rahul Sharma
- **Name**: Neha Gupta
- **Name**: Kiran Patel

### Pharmacist
- **Name**: Priyanka Das

## 🏗️ Technology Stack

- **Frontend Framework**: React 18.2.0
- **Routing**: React Router DOM 6.20.0
- **State Management**: React Context API + Hooks
- **Build Tool**: Vite 5.0.0
- **Styling**: CSS3 (Flexbox, Grid)
- **Language**: JavaScript (JSX only, no TypeScript)

## 💾 State Management Architecture

### Global State (AppContext)
- `currentUser` - Currently logged-in user
- `users` - Mock user database
- `doctors` - Available doctors list
- `appointments` - All appointments
- `prescriptions` - All prescriptions
- `medicineOrders` - All medicine orders

### State Functions
- `loginUser(name, role)` - Authenticate user
- `logoutUser()` - Logout current user
- `bookAppointment(doctorId, patientId, date, symptoms)` - Book appointment
- `updateAppointmentStatus(appointmentId, status)` - Update appointment
- `addPrescription(appointmentId, doctorId, medicines, notes)` - Add prescription
- `createMedicineOrder(prescriptionId, patientId, medicines)` - Create order
- `updateMedicineOrderStatus(orderId, status)` - Update order status

## 🎨 Design System

### Color Scheme
- **Primary**: #1e3a8a (Deep Blue)
- **Secondary**: #3b82f6 (Sky Blue)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Danger**: #ef4444 (Red)

### Components
- Card-based layout
- Responsive grid system
- Status badges
- Interactive forms
- Data tables
- Empty states

## 🔄 Data Flow & Interconnections

1. **Patient Books Appointment**
   - Appointment appears in Doctor Dashboard (Pending)

2. **Doctor Accepts Appointment**
   - Status updates to "Accepted" in Patient Dashboard
   - Accessible to add prescription

3. **Doctor Adds Prescription**
   - Prescription visible to Pharmacist
   - Appointment status changes to "Completed"

4. **Pharmacist Creates Medicine Order**
   - Order visible to Patient in "Medicine Orders" tab
   - Initial status: "Preparing"

5. **Pharmacist Updates Order Status**
   - Patient can track order: Preparing → Ready → Delivered

## 📱 Responsive Design

- Desktop-first design
- Mobile-friendly layout
- Flexible grid system
- Responsive navigation

## ✨ Key Features Implemented

✅ **Role-Based Access Control**: Different dashboards for each role
✅ **Real-time State Management**: Context API for instant updates
✅ **Appointment Management**: Full lifecycle from booking to completion
✅ **Prescription System**: Doctors can prescribe after appointments
✅ **Order Tracking**: Patients can track medicine orders
✅ **User Management**: Admin dashboard with user statistics
✅ **Protected Routes**: Authentication required for dashboard access
✅ **Clean UI/UX**: Professional medical theme with intuitive navigation
✅ **Form Validation**: Input validation for all forms
✅ **Mock Data**: Pre-populated with realistic healthcare data

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

## 📝 Notes

- **No Backend**: All data is stored in React Context (in-memory)
- **No Database**: Demo data resets on page refresh
- **No Authentication Server**: Simple role-based login
- **Frontend Only**: No API calls or external services
- **JSX Only**: No TypeScript, pure JavaScript with JSX syntax

## 🎯 Future Enhancements

- Backend API integration
- Database integration
- User authentication with JWT
- Real-time notifications
- Advanced search and filtering
- Data persistence
- Export functionality
- Mobile app

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ using React & Vite**
