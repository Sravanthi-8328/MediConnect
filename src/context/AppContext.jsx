import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const ROLE_TO_API = {
  Admin: 'ADMIN',
  Doctor: 'DOCTOR',
  Patient: 'PATIENT',
  Pharmacist: 'PHARMACIST',
};

const ROLE_FROM_API = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
  PHARMACIST: 'Pharmacist',
};

const FALLBACK_API_BASE_URL = 'http://localhost:8080';

const APPOINTMENT_STATUS_FROM_API = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

const ORDER_STATUS_FROM_API = {
  PROCESSING: 'Processing',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

const ORDER_STATUS_TO_API = {
  Processing: 'PROCESSING',
  Preparing: 'PREPARING',
  Ready: 'READY',
  Dispatched: 'DISPATCHED',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  Delivered: 'DELIVERED',
};

const DOCTOR_IMAGES_BY_NAME = {
  'Dr. Ananya Rao': 'https://images.unsplash.com/photo-1594824475544-3aa4e0c1020f?w=220&h=220&fit=crop&crop=face',
  'Dr. Arjun Menon': 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=220&h=220&fit=crop&crop=face',
  'Dr. Meera Iyer': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=220&h=220&fit=crop&crop=face',
  'Dr. Vikram Kapoor': 'https://images.unsplash.com/photo-1614436163996-25cee5f54290?w=220&h=220&fit=crop&crop=face',
  'Dr. Nisha Verma': 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=220&h=220&fit=crop&crop=face',
  'Dr. Rohan Kulkarni': 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=220&h=220&fit=crop&crop=face',
  'Dr. Sana Mirza': 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=220&h=220&fit=crop&crop=face',
  'Dr. Karthik Reddy': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=220&h=220&fit=crop&crop=face',
};

const DEFAULT_DOCTOR_IMAGE = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=220&h=220&fit=crop&crop=face';

function getDoctorImageByName(name) {
  return DOCTOR_IMAGES_BY_NAME[name] || DEFAULT_DOCTOR_IMAGE;
}

async function apiRequest(path, options = {}) {
  const requestUrls = API_BASE_URL
    ? [`${API_BASE_URL}${path}`]
    : [path, `${FALLBACK_API_BASE_URL}${path}`];

  let response;
  let lastError = null;

  for (const requestUrl of requestUrls) {
    try {
      const isFormDataRequest = options.body instanceof FormData;
      response = await fetch(requestUrl, {
        headers: isFormDataRequest
          ? { ...(options.headers || {}) }
          : { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });

      if (response.ok || requestUrl.startsWith(FALLBACK_API_BASE_URL)) {
        break;
      }

      if (response.status !== 404 || requestUrls.length === 1) {
        break;
      }
    } catch (error) {
      lastError = error;
      response = null;
      continue;
    }
  }

  if (!response) {
    const backendHost = API_BASE_URL || FALLBACK_API_BASE_URL;
    throw new Error(
      `Unable to reach backend server at ${backendHost}. Start the backend and try again.`
    );
  }

  if (!response.ok) {
    let message = `Request failed (HTTP ${response.status})`;
    try {
      const raw = await response.text();
      if (raw) {
        try {
          const err = JSON.parse(raw);
          message = err.message || raw;
        } catch {
          message = raw;
        }
      } else if ([502, 503, 504].includes(response.status)) {
        const backendHost = API_BASE_URL || FALLBACK_API_BASE_URL;
        message = `Unable to reach backend server at ${backendHost}. Start the backend and try again.`;
      }
    } catch {
      // Keep fallback message.
    }

    if (/ECONNREFUSED|fetch failed|Failed to fetch/i.test(message)) {
      const backendHost = API_BASE_URL || FALLBACK_API_BASE_URL;
      message = `Unable to reach backend server at ${backendHost}. Start the backend and try again.`;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function parseJsonArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObjectField(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function generateTimeSlots() {
  const slots = {};
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    slots[dateStr] = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    ];
  }
  return slots;
}

function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: ROLE_FROM_API[user.role] || user.role,
    phone: user.phone || '',
    isBlocked: !!user.blocked,
    avatar: null,
  };
}

function mapDoctor(doctor) {
  return {
    id: doctor.doctorId,
    name: doctor.name,
    email: doctor.email,
    specialization: doctor.specialization || 'General Physician',
    experience: doctor.experience || '',
    city: doctor.city || '',
    fee: doctor.fee || 0,
    rating: doctor.rating || 0,
    consultationType: ['Video', 'Clinic'],
    availability: 'Mon-Fri: 9AM-5PM',
    availableSlots: generateTimeSlots(),
    reviews: 0,
    location: doctor.city || 'Medical Center',
    imageUrl: doctor.imageUrl || getDoctorImageByName(doctor.name),
    about: doctor.about || 'Experienced healthcare specialist available for consultation.',
    education: doctor.education || 'MBBS, MD',
    languages: Array.isArray(doctor.languages) ? doctor.languages : ['English'],
  };
}

function mapAppointment(appointment) {
  return {
    id: appointment.id,
    doctorId: appointment.doctor?.id,
    patientId: appointment.patient?.id,
    date: appointment.date,
    time: appointment.time,
    type: appointment.type,
    bookingFor: appointment.bookingFor || 'self',
    patientName: appointment.patientName || appointment.patient?.name || null,
    patientPhone: appointment.patientPhone || appointment.patient?.phone || null,
    patientEmail: appointment.patientEmail || appointment.patient?.email || null,
    symptoms: appointment.symptoms,
    status: APPOINTMENT_STATUS_FROM_API[appointment.status] || appointment.status,
    diagnosis: appointment.diagnosis || null,
    notes: appointment.notes || null,
    rejectionReason: appointment.rejectionReason || null,
    meetingLink: appointment.meetingLink || null,
    paymentStatus: appointment.paymentStatus || 'UNPAID',
    paymentTransactionId: appointment.paymentTransactionId || null,
    consultationFee: Number(appointment.consultationFee || 0),
    createdAt: appointment.createdAt,
    prescriptionId: null,
  };
}

function mapPrescription(prescription) {
  return {
    id: prescription.id,
    appointmentId: prescription.appointment?.id,
    patientId: prescription.patient?.id,
    doctorId: prescription.doctor?.id,
    medicines: parseJsonArrayField(prescription.medicinesJson),
    notes: prescription.notes || '',
    diagnosis: prescription.diagnosis || '',
    createdAt: prescription.createdAt,
    status: 'Active',
  };
}

function mapLabReport(report) {
  return {
    id: report.id,
    patientId: report.patient?.id ?? report.patientId,
    name: report.name,
    type: report.type,
    date: report.date,
    doctor: report.doctor || '',
    lab: report.lab || '',
    status: report.status || 'Uploaded',
    results: parseJsonObjectField(report.resultsJson || report.results),
    fileUrl: report.fileUrl || '',
    createdAt: report.createdAt,
  };
}

function mapOrder(order) {
  return {
    id: order.id,
    prescriptionId: order.prescription?.id,
    patientId: order.patient?.id,
    medicines: parseJsonArrayField(order.medicinesJson),
    totalAmount: Number(order.totalAmount || 0),
    status: ORDER_STATUS_FROM_API[order.status] || order.status,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    trackingId: order.trackingId,
    address: order.address || '',
    paymentStatus: order.paymentStatus || 'PENDING',
    paymentTransactionId: order.paymentTransactionId || null,
    paymentMethod: order.paymentMethod || null,
    createdAt: order.createdAt,
  };
}

function mapNotification(notification) {
  return {
    id: notification.id,
    userId: notification.user?.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.read,
    createdAt: notification.createdAt,
  };
}

function mapInventory(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    stock: item.stock,
    minStock: item.minStock,
    price: Number(item.price || 0),
    unit: item.unit,
    supplier: item.supplier,
    expiryDate: item.expiryDate,
  };
}

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = localStorage.getItem('mediconnect.currentUser');
    return raw ? JSON.parse(raw) : null;
  });

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [medicineOrders, setMedicineOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [doctorVerifications, setDoctorVerifications] = useState([]);
  const [systemSettings, setSystemSettings] = useState({});

  const loadUsers = async () => {
    const data = await apiRequest('/api/users');
    setUsers(data.map(mapUser));
  };

  const loadDoctors = async () => {
    const data = await apiRequest('/api/doctors');
    setDoctors(data.map(mapDoctor));
  };

  const loadAppointments = async () => {
    const data = await apiRequest('/api/appointments');
    setAppointments(data.map(mapAppointment));
  };

  const loadPrescriptions = async () => {
    const data = await apiRequest('/api/prescriptions');
    setPrescriptions(data.map(mapPrescription));
  };

  const loadOrders = async () => {
    const data = await apiRequest('/api/orders');
    setMedicineOrders(data.map(mapOrder));
  };

  const loadInventory = async () => {
    const data = await apiRequest('/api/inventory');
    setInventory(data.map(mapInventory));
  };

  const loadAdminData = async () => {
    const [settings, verifications] = await Promise.all([
      apiRequest('/api/admin/settings'),
      apiRequest('/api/admin/doctor-verifications'),
    ]);
    setSystemSettings(settings || {});
    setDoctorVerifications(verifications || []);
  };

  const loadPatientMedicalData = async (patientId) => {
    const [labs, records] = await Promise.all([
      apiRequest(`/api/lab-reports/patient/${patientId}`),
      apiRequest(`/api/health-records/patient/${patientId}`),
    ]);
    setLabReports((labs || []).map(mapLabReport));
    setHealthRecords(records || []);
  };

  const loadNotifications = async (userId) => {
    const data = await apiRequest(`/api/notifications/user/${userId}`);
    setNotifications((data || []).map(mapNotification));
  };

  const refreshAll = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadDoctors(),
        loadAppointments(),
        loadPrescriptions(),
        loadOrders(),
        loadInventory(),
      ]);

      if (currentUser) {
        await Promise.all([
          loadNotifications(currentUser.id),
          loadAdminData(),
          loadPatientMedicalData(currentUser.id),
        ]);
      }
    } catch (error) {
      console.error('Failed to load backend data:', error);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mediconnect.currentUser', JSON.stringify(currentUser));
      loadNotifications(currentUser.id).catch(console.error);
      loadPatientMedicalData(currentUser.id).catch(console.error);
    } else {
      localStorage.removeItem('mediconnect.currentUser');
      setNotifications([]);
    }
  }, [currentUser]);

  const registerUser = async (name, email, password, role, phone = '') => {
    try {
      const result = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role: ROLE_TO_API[role] || role.toUpperCase(),
          phone,
        }),
      });

      await loadUsers();
      return { success: !!result?.success, message: result?.message || 'Account created successfully!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const loginUser = async (email, password, role) => {
    try {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: ROLE_TO_API[role] || role.toUpperCase() }),
      });

      if (result?.success) {
        const user = {
          id: result.userId,
          name: result.name,
          email: result.email,
          role: ROLE_FROM_API[result.role] || role,
        };
        setCurrentUser(user);
        await refreshAll();
        return { success: true };
      }

      return { success: false, message: result?.message || 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const updateUserProfile = async (userId, profileData) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...profileData } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...profileData }));
    }
  };

  const processConsultationPayment = async (patientId, doctorId, amount, paymentDetails) => {
    return apiRequest('/api/payments/consultation', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        doctorId,
        amount: Number(amount).toFixed(2),
        paymentMethod: paymentDetails.paymentMethod,
        upiId: paymentDetails.upiId,
        cardNumber: paymentDetails.cardNumber,
        cardHolderName: paymentDetails.cardHolderName,
        expiry: paymentDetails.expiry,
        cvv: paymentDetails.cvv,
      }),
    });
  };

  const processMedicineOrderPayment = async (patientId, amount, paymentDetails) => {
    return apiRequest('/api/payments/medicine-order', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        amount: Number(amount).toFixed(2),
        paymentMethod: paymentDetails.paymentMethod,
        upiId: paymentDetails.upiId,
        cardNumber: paymentDetails.cardNumber,
        cardHolderName: paymentDetails.cardHolderName,
        expiry: paymentDetails.expiry,
        cvv: paymentDetails.cvv,
      }),
    });
  };

  const sendOtpToPhone = async (phoneNumber) => {
    return apiRequest('/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  };

  const verifyPhoneOtp = async (phoneNumber, otp) => {
    return apiRequest('/api/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  };

  const getAvailableTimeSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      return [];
    }

    const encodedDate = encodeURIComponent(date);
    return apiRequest(`/api/appointments/doctor/${doctorId}/availability?date=${encodedDate}`);
  };

  const getAppointmentMeetingLink = async (appointmentId) => {
    const data = await apiRequest(`/api/appointments/${appointmentId}/meeting-link`);
    const meetingLink = data?.meetingLink || null;

    if (meetingLink) {
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, meetingLink } : a)));
    }

    return meetingLink;
  };

  const bookAppointment = async (doctorId, patientId, date, time, type, symptoms, paymentData = null, patientDetails = null) => {
    const created = await apiRequest('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        doctorId,
        patientId,
        date,
        time,
        type,
        patientBookingFor: patientDetails?.bookingFor || 'self',
        patientName: patientDetails?.name || null,
        patientPhone: patientDetails?.phone || null,
        patientEmail: patientDetails?.email || null,
        symptoms,
        paymentStatus: paymentData?.status || 'UNPAID',
        paymentTransactionId: paymentData?.transactionId || null,
        consultationFee: paymentData?.amount != null ? Number(paymentData.amount).toFixed(2) : null,
      }),
    });

    const mapped = mapAppointment(created);
    setAppointments((prev) => [...prev, mapped]);
    return mapped;
  };

  const updateAppointmentStatus = async (appointmentId, status, additionalData = {}) => {
    const statusBody = {
      status: (status || '').toUpperCase(),
      diagnosis: additionalData.diagnosis || null,
      notes: additionalData.notes || null,
      rejectionReason: additionalData.rejectionReason || null,
    };

    const updated = await apiRequest(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusBody),
    });

    const mapped = mapAppointment(updated);
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? mapped : a)));
  };

  const cancelAppointment = async (appointmentId) => {
    await updateAppointmentStatus(appointmentId, 'CANCELLED');
  };

  const rescheduleAppointment = async (appointmentId, newDate, newTime) => {
    const original = appointments.find((a) => a.id === appointmentId);
    if (!original) return;

    await updateAppointmentStatus(appointmentId, 'RESCHEDULED');
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, date: newDate, time: newTime } : a)));
  };

  const addPrescription = async (appointmentId, patientId, doctorId, medicines, notes, diagnosis) => {
    const created = await apiRequest('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify({
        appointmentId,
        patientId,
        doctorId,
        medicinesJson: JSON.stringify(medicines),
        notes,
        diagnosis,
      }),
    });

    const mapped = mapPrescription(created);
    setPrescriptions((prev) => [mapped, ...prev]);
    await loadAppointments();
    return mapped;
  };

  const getPrescriptionSuggestions = async (symptoms) => {
    return apiRequest(`/api/prescriptions/suggestions?symptoms=${encodeURIComponent(symptoms || '')}`);
  };

  const createMedicineOrder = async (prescriptionId, patientId, medicines, address, paymentData = null) => {
    const totalAmount = medicines.reduce((sum, med) => sum + Number(med.price || 0) * Number(med.quantity || 0), 0);

    const created = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        prescriptionId,
        patientId,
        medicinesJson: JSON.stringify(medicines),
        totalAmount: totalAmount.toFixed(2),
        address,
        paymentStatus: paymentData?.status || 'PENDING',
        paymentTransactionId: paymentData?.transactionId || null,
        paymentMethod: paymentData?.paymentMethod || null,
      }),
    });

    const mapped = mapOrder(created);
    setMedicineOrders((prev) => [mapped, ...prev]);
    return mapped;
  };

  const updateMedicineOrderStatus = async (orderId, status, deliveryDate = null) => {
    const apiStatus = ORDER_STATUS_TO_API[status] || (status || '').toUpperCase().replace(/ /g, '_');
    const updated = await apiRequest(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: apiStatus }),
    });

    const mapped = mapOrder(updated);
    setMedicineOrders((prev) => prev.map((o) => (o.id === orderId ? { ...mapped, deliveryDate: deliveryDate || mapped.deliveryDate } : o)));
  };

  const addLabReport = async (patientId, reportData) => {
    const created = await apiRequest('/api/lab-reports', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        name: reportData.name,
        type: reportData.type,
        date: reportData.date,
        doctor: reportData.doctor,
        lab: reportData.lab,
        status: reportData.status,
        resultsJson: JSON.stringify(reportData.results || {}),
        fileUrl: reportData.fileUrl || '',
      }),
    });

    const mapped = mapLabReport(created);
    setLabReports((prev) => [mapped, ...prev]);
    return mapped;
  };

  const uploadLabReportFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest('/api/lab-reports/upload', {
      method: 'POST',
      body: formData,
    });
  };

  const addHealthRecord = async (patientId, recordData) => {
    const created = await apiRequest('/api/health-records', {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        type: recordData.type,
        title: recordData.title,
        description: recordData.description,
        date: recordData.date || new Date().toISOString().split('T')[0],
        doctor: recordData.doctor,
      }),
    });

    setHealthRecords((prev) => [created, ...prev]);
    return created;
  };

  const addNotification = (userId, type, title, message) => {
    // Notifications are generated by backend-side flows. Keep no-op API-compatible function.
    setNotifications((prev) => [
      {
        id: Date.now(),
        userId,
        type,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const markNotificationAsRead = async (notificationId) => {
    await apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = async (userId) => {
    const unread = notifications.filter((n) => n.userId === userId && !n.isRead);
    await Promise.all(unread.map((n) => markNotificationAsRead(n.id)));
  };

  const getAppointmentsByDoctor = (doctorId) => appointments.filter((app) => app.doctorId === doctorId);
  const getAppointmentsByPatient = (patientId) => appointments.filter((app) => app.patientId === patientId);

  const getUpcomingAppointments = (patientId) => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter((app) => app.patientId === patientId && app.date >= today && !['Cancelled', 'Completed'].includes(app.status))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getPastAppointments = (patientId) => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter((app) => app.patientId === patientId && (app.date < today || app.status === 'Completed'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getPrescriptionsByPatient = (patientId) => prescriptions.filter((pres) => pres.patientId === patientId);
  const getLabReportsByPatient = (patientId) => labReports.filter((report) => report.patient?.id === patientId || report.patientId === patientId);
  const getHealthRecordsByPatient = (patientId) => healthRecords.filter((record) => record.patient?.id === patientId || record.patientId === patientId);
  const getMedicineOrdersByPatient = (patientId) => medicineOrders.filter((order) => order.patientId === patientId);

  const getNotificationsByUser = (userId) => notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getUnreadNotificationsCount = (userId) => notifications.filter((n) => n.userId === userId && !n.isRead).length;

  const getUserById = (userId) => users.find((u) => u.id === userId);
  const getDoctorById = (doctorId) => doctors.find((d) => d.id === doctorId);
  const getPrescriptionById = (prescriptionId) => prescriptions.find((p) => p.id === prescriptionId);
  const getMedicineOrderById = (orderId) => medicineOrders.find((m) => m.id === orderId);

  const getTodayAppointmentsForDoctor = (doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((app) => app.doctorId === doctorId && app.date === today && !['Cancelled', 'Rejected'].includes(app.status));
  };

  const getPendingRequestsForDoctor = (doctorId) => appointments.filter((app) => app.doctorId === doctorId && app.status === 'Pending');

  const getUpcomingAppointmentsForDoctor = (doctorId) => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter((app) => app.doctorId === doctorId && app.date >= today && ['Confirmed', 'Accepted'].includes(app.status))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getCompletedAppointmentsForDoctor = (doctorId) => appointments.filter((app) => app.doctorId === doctorId && app.status === 'Completed');

  const getPrescriptionsByDoctor = (doctorId) => prescriptions.filter((pres) => pres.doctorId === doctorId);

  const getPatientsForDoctor = (doctorId) => {
    const ids = [...new Set(appointments.filter((app) => app.doctorId === doctorId).map((app) => app.patientId))];
    return ids.map((id) => getUserById(id)).filter(Boolean);
  };

  const getPatientHistoryForDoctor = (doctorId, patientId) =>
    appointments.filter((app) => app.doctorId === doctorId && app.patientId === patientId);

  const acceptAppointment = async (appointmentId) => {
    await updateAppointmentStatus(appointmentId, 'CONFIRMED');
  };

  const rejectAppointment = async (appointmentId, reason = '') => {
    await updateAppointmentStatus(appointmentId, 'REJECTED', { rejectionReason: reason });
  };

  const completeConsultation = async (appointmentId, notes, diagnosis) => {
    await updateAppointmentStatus(appointmentId, 'COMPLETED', { notes, diagnosis });
  };

  const updateDoctorProfile = async (doctorId, profileData) => {
    setDoctors((prev) => prev.map((d) => (d.id === doctorId ? { ...d, ...profileData } : d)));
  };

  const updateDoctorAvailability = async (doctorId, availabilityData) => {
    setDoctors((prev) => prev.map((d) => (d.id === doctorId ? { ...d, ...availabilityData } : d)));
  };

  const getFollowUpsDue = (doctorId) => [];

  const searchDoctors = (query, filters = {}) => {
    let results = [...doctors];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter((d) => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q));
    }

    if (filters.specialization) {
      results = results.filter((d) => d.specialization.toLowerCase() === filters.specialization.toLowerCase());
    }

    if (filters.city) {
      results = results.filter((d) => d.city.toLowerCase() === filters.city.toLowerCase());
    }

    if (filters.consultationType) {
      results = results.filter((d) => d.consultationType.includes(filters.consultationType));
    }

    if (filters.maxFee) {
      results = results.filter((d) => d.fee <= filters.maxFee);
    }

    if (filters.minRating) {
      results = results.filter((d) => d.rating >= filters.minRating);
    }

    return results;
  };

  const getSpecializations = () => [...new Set(doctors.map((d) => d.specialization))].sort();
  const getCities = () => [...new Set(doctors.map((d) => d.city))].sort();

  const getPrescriptionsForPharmacist = () =>
    prescriptions.map((pres) => {
      const patient = getUserById(pres.patientId);
      const doctor = getDoctorById(pres.doctorId);
      const existingOrder = medicineOrders.find((o) => o.prescriptionId === pres.id);
      return {
        ...pres,
        patientName: patient?.name || 'Unknown',
        doctorName: doctor?.name || 'Unknown',
        orderStatus: existingOrder?.status || 'Awaiting Processing',
        orderId: existingOrder?.id || null,
      };
    });

  const getPharmacistStats = () => {
    const pendingPrescriptions = prescriptions.filter((p) => !medicineOrders.some((o) => o.prescriptionId === p.id)).length;
    const processingOrders = medicineOrders.filter((o) => ['Processing', 'Preparing'].includes(o.status)).length;
    const readyOrders = medicineOrders.filter((o) => o.status === 'Ready').length;
    const dispatchedOrders = medicineOrders.filter((o) => ['Dispatched', 'Out for Delivery'].includes(o.status)).length;
    const deliveredOrders = medicineOrders.filter((o) => o.status === 'Delivered').length;
    const lowStockItems = inventory.filter((i) => i.stock <= i.minStock).length;
    return { pendingPrescriptions, processingOrders, readyOrders, dispatchedOrders, deliveredOrders, lowStockItems };
  };

  const getLowStockItems = () => inventory.filter((i) => i.stock <= i.minStock);

  const updateInventoryItem = async (itemId, updates) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const updated = await apiRequest(`/api/inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...item, ...updates }),
    });

    setInventory((prev) => prev.map((i) => (i.id === itemId ? mapInventory(updated) : i)));
  };

  const addInventoryItem = async (itemData) => {
    const created = await apiRequest('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });

    const mapped = mapInventory(created);
    setInventory((prev) => [...prev, mapped]);
    return mapped;
  };

  const acceptPrescriptionOrder = async (prescriptionId, patientId, address = '123 Main St, New York, NY') => {
    const prescription = prescriptions.find((p) => p.id === prescriptionId);
    if (!prescription) return null;

    const medicines = (prescription.medicines || []).map((med) => ({
      name: med.name,
      quantity: parseInt(med.duration, 10) || 7,
      price: 10.99,
    }));

    return createMedicineOrder(prescriptionId, patientId, medicines, address);
  };

  const updateOrderStatusWithTimeline = async (orderId, newStatus) => {
    await updateMedicineOrderStatus(orderId, newStatus);
  };

  const getAdminStats = () => {
    const totalPatients = users.filter((u) => u.role === 'Patient').length;
    const totalDoctors = users.filter((u) => u.role === 'Doctor').length;
    const totalPharmacists = users.filter((u) => u.role === 'Pharmacist').length;
    const totalAppointments = appointments.length;
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter((a) => a.date === today).length;
    const pendingVerifications = doctors.filter((d) => !doctorVerifications.some((v) => v.doctor?.id === d.id && v.status === 'Verified')).length;
    const totalRevenue = medicineOrders.filter((o) => o.status === 'Delivered').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const cancelledAppointments = appointments.filter((a) => a.status === 'Cancelled').length;
    const completedAppointments = appointments.filter((a) => a.status === 'Completed').length;
    return {
      totalPatients,
      totalDoctors,
      totalPharmacists,
      totalAppointments,
      todayAppointments,
      pendingVerifications,
      totalRevenue,
      cancelledAppointments,
      completedAppointments,
      cancellationRate: totalAppointments ? ((cancelledAppointments / totalAppointments) * 100).toFixed(1) : '0.0',
    };
  };

  const getAppointmentsByDateRange = (startDate, endDate) =>
    appointments.filter((a) => a.date >= startDate && a.date <= endDate);

  const getDailyAppointmentCounts = (days = 7) => {
    const counts = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = appointments.filter((a) => a.date === dateStr).length;
      counts.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return counts;
  };

  const getPopularSpecializations = () => {
    const specCounts = {};
    appointments.forEach((apt) => {
      const doctor = getDoctorById(apt.doctorId);
      if (doctor) {
        specCounts[doctor.specialization] = (specCounts[doctor.specialization] || 0) + 1;
      }
    });
    return Object.entries(specCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const verifyDoctor = async (doctorId) => {
    const updated = await apiRequest(`/api/admin/doctor-verifications/${doctorId}/verify`, { method: 'PATCH' });
    setDoctorVerifications((prev) => {
      const exists = prev.some((v) => v.id === updated.id);
      return exists ? prev.map((v) => (v.id === updated.id ? updated : v)) : [...prev, updated];
    });
  };

  const toggleUserBlock = async (userId) => {
    const result = await apiRequest(`/api/admin/users/${userId}/toggle-block`, { method: 'PATCH' });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: result.blocked } : u)));
  };

  const updateSystemSettings = async (newSettings) => {
    const updated = await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });
    setSystemSettings(updated || {});
  };

  const getDoctorVerificationStatus = (doctorId) =>
    doctorVerifications.find((v) => v.doctor?.id === doctorId) || { status: 'Pending' };

  const getAllOrders = () =>
    medicineOrders.map((order) => ({
      ...order,
      patient: getUserById(order.patientId),
      prescription: getPrescriptionById(order.prescriptionId),
    }));

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    users,
    doctors,
    appointments,
    prescriptions,
    labReports,
    healthRecords,
    medicineOrders,
    notifications,
    registerUser,
    loginUser,
    logoutUser,
    updateUserProfile,
    processConsultationPayment,
    processMedicineOrderPayment,
    sendOtpToPhone,
    verifyPhoneOtp,
    getAvailableTimeSlots,
    getAppointmentMeetingLink,
    bookAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment,
    addPrescription,
    getPrescriptionSuggestions,
    createMedicineOrder,
    updateMedicineOrderStatus,
    addLabReport,
    uploadLabReportFile,
    addHealthRecord,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getAppointmentsByDoctor,
    getAppointmentsByPatient,
    getUpcomingAppointments,
    getPastAppointments,
    getPrescriptionsByPatient,
    getLabReportsByPatient,
    getHealthRecordsByPatient,
    getMedicineOrdersByPatient,
    getNotificationsByUser,
    getUnreadNotificationsCount,
    getUserById,
    getDoctorById,
    getPrescriptionById,
    getMedicineOrderById,
    searchDoctors,
    getSpecializations,
    getCities,
    getTodayAppointmentsForDoctor,
    getPendingRequestsForDoctor,
    getUpcomingAppointmentsForDoctor,
    getCompletedAppointmentsForDoctor,
    getPrescriptionsByDoctor,
    getPatientsForDoctor,
    getPatientHistoryForDoctor,
    acceptAppointment,
    rejectAppointment,
    completeConsultation,
    updateDoctorProfile,
    updateDoctorAvailability,
    getFollowUpsDue,
    inventory,
    getPrescriptionsForPharmacist,
    getPharmacistStats,
    getLowStockItems,
    updateInventoryItem,
    addInventoryItem,
    acceptPrescriptionOrder,
    updateOrderStatusWithTimeline,
    systemSettings,
    doctorVerifications,
    getAdminStats,
    getAppointmentsByDateRange,
    getDailyAppointmentCounts,
    getPopularSpecializations,
    verifyDoctor,
    toggleUserBlock,
    updateSystemSettings,
    getDoctorVerificationStatus,
    getAllOrders,
  }), [
    currentUser,
    users,
    doctors,
    appointments,
    prescriptions,
    labReports,
    healthRecords,
    medicineOrders,
    notifications,
    inventory,
    systemSettings,
    doctorVerifications,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
