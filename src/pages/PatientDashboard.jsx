import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import QrScanner from 'qr-scanner';

const PatientDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentUser,
    doctors,
    getUpcomingAppointments,
    getPastAppointments,
    getPrescriptionsByPatient,
    getLabReportsByPatient,
    getHealthRecordsByPatient,
    getMedicineOrdersByPatient,
    getNotificationsByUser,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    createMedicineOrder,
    addLabReport,
    uploadLabReportFile,
    searchDoctors,
    getSpecializations,
    getCities,
    getDoctorById,
    updateUserProfile,
    processConsultationPayment,
    processMedicineOrderPayment,
    getAvailableTimeSlots,
    getAppointmentMeetingLink,
  } = useAppContext();

  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'appointments');

  // Sync activeSection with URL params
  useEffect(() => {
    const sectionFromUrl = searchParams.get('section') || 'appointments';
    const normalizedSection = sectionFromUrl === 'dashboard' ? 'appointments' : sectionFromUrl;

    if (sectionFromUrl === 'dashboard') {
      setSearchParams({ section: 'appointments' });
    }

    if (normalizedSection !== activeSection) {
      setActiveSection(normalizedSection);
    }
  }, [searchParams, activeSection, setSearchParams]);

  // Update URL when activeSection changes
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [videoCallUrl, setVideoCallUrl] = useState('');
  const [videoCallAppointment, setVideoCallAppointment] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    city: '',
    consultationType: '',
    maxFee: '',
    minRating: ''
  });
  
  // Booking states
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'Clinic',
    symptoms: ''
  });
  const [bookingPatientFor, setBookingPatientFor] = useState('self');
  const [bookingPatientName, setBookingPatientName] = useState(currentUser?.name || '');
  const [bookingPatientPhone, setBookingPatientPhone] = useState(currentUser?.phone || '');
  const [bookingPatientEmail, setBookingPatientEmail] = useState(currentUser?.email || '');
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'CARD',
    upiId: '',
    cardNumber: '',
    cardHolderName: '',
    expiry: '',
    cvv: ''
  });
  const [rememberCard, setRememberCard] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeScanner, setActiveScanner] = useState(null);
  const [scannerError, setScannerError] = useState('');
  const scannerVideoRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const [showMedicineOrderModal, setShowMedicineOrderModal] = useState(false);
  const [orderBookingStep, setOrderBookingStep] = useState(1);
  const [selectedPrescriptionForOrder, setSelectedPrescriptionForOrder] = useState(null);
  const [orderMedicines, setOrderMedicines] = useState([]);
  const [orderAddress, setOrderAddress] = useState('123 Main St, New York, NY');
  const [orderPaymentData, setOrderPaymentData] = useState({
    paymentMethod: 'CARD',
    upiId: '',
    cardNumber: '',
    cardHolderName: '',
    expiry: '',
    cvv: ''
  });
  const [orderRememberCard, setOrderRememberCard] = useState(true);
  const [orderPaymentLoading, setOrderPaymentLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [availableSlotsLoading, setAvailableSlotsLoading] = useState(false);
  const [availableSlotsError, setAvailableSlotsError] = useState('');
  const [showLabUploadModal, setShowLabUploadModal] = useState(false);
  const [labUploadLoading, setLabUploadLoading] = useState(false);
  const [labUploadForm, setLabUploadForm] = useState({
    name: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    doctor: '',
    lab: '',
    file: null,
  });

  // Get data
  const upcomingAppointments = getUpcomingAppointments(currentUser.id);
  const pastAppointments = getPastAppointments(currentUser.id);
  const prescriptions = getPrescriptionsByPatient(currentUser.id);
  const labReports = getLabReportsByPatient(currentUser.id);
  const healthRecords = getHealthRecordsByPatient(currentUser.id);
  const medicineOrders = getMedicineOrdersByPatient(currentUser.id);
  const notifications = getNotificationsByUser(currentUser.id);
  const unreadCount = getUnreadNotificationsCount(currentUser.id);

  // Filtered doctors
  const filteredDoctors = searchDoctors(searchQuery, {
    specialization: filters.specialization,
    city: filters.city,
    consultationType: filters.consultationType,
    maxFee: filters.maxFee ? parseInt(filters.maxFee) : null,
    minRating: filters.minRating ? parseFloat(filters.minRating) : null
  });

  const specializations = getSpecializations();
  const cities = getCities();
  const formatInr = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
  const firstName = (currentUser?.name || 'Patient').split(' ')[0];
  const userInitial = (currentUser?.name || 'P').charAt(0).toUpperCase();
  const dashboardHeroImage = 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=900&q=80';
  const t = (key) => ({
    welcome: 'Welcome',
    feeling: 'How are you feeling today?',
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications',
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    prescriptions: 'Prescriptions',
    labReports: 'Lab Reports',
    orders: 'Orders',
    healthRecords: 'Health Records',
    profile: 'Profile',
  }[key] || key);

  // Get next appointment
  const nextAppointment = upcomingAppointments[0];

  const isVideoAppointment = (appointment) =>
    (appointment?.type || '').trim().toLowerCase() === 'video';

  const canJoinCall = (appointment) => {
    const status = (appointment?.status || '').trim().toLowerCase();
    return ['pending', 'confirmed', 'accepted', 'rescheduled'].includes(status);
  };

  // Handle booking
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
  };

  const handleQuickBookDoctor = (doctor, type = 'Clinic') => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(false);
    setShowBookingModal(true);
    resetBookingFlow();
    setBookingData((prev) => ({ ...prev, type }));
  };

  const normalizePhoneNumber = (phone) => (phone || '').replace(/\s+/g, '').trim();

  const isValidPhoneNumber = (phone) => /^\+?[0-9]{10,15}$/.test(normalizePhoneNumber(phone));

  const normalizeCardNumber = (value) =>
    (value || '')
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();

  const normalizeExpiry = (value) => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) {
      return digits;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const parseUpiIdFromQrPayload = (payload) => {
    const raw = (payload || '').trim();
    if (!raw) return '';

    if (/^upi:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        const upiId = url.searchParams.get('pa');
        return upiId ? upiId.trim() : '';
      } catch {
        return '';
      }
    }

    const upiMatch = raw.match(/[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}/);
    return upiMatch ? upiMatch[0] : '';
  };

  const stopQrScanner = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.stop();
      scannerInstanceRef.current.destroy();
      scannerInstanceRef.current = null;
    }
    setActiveScanner(null);
  };

  const startQrScanner = async (mode) => {
    setScannerError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError('Camera access is not available on this device.');
      return;
    }

    try {
      stopQrScanner();
      setActiveScanner(mode);

      if (!scannerVideoRef.current) {
        throw new Error('Unable to start scanner preview');
      }

      scannerInstanceRef.current = new QrScanner(
        scannerVideoRef.current,
        (result) => {
          const payload = typeof result === 'string' ? result : (result?.data || '');
          const upiId = parseUpiIdFromQrPayload(payload);

          if (!upiId) {
            setScannerError('QR code detected, but it does not contain a valid UPI ID.');
            return;
          }

          if (mode === 'consultation') {
            setPaymentData((prev) => ({ ...prev, upiId }));
          } else if (mode === 'order') {
            setOrderPaymentData((prev) => ({ ...prev, upiId }));
          }

          setScannerError('');
          stopQrScanner();
        },
        {
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scannerInstanceRef.current.start();
    } catch (error) {
      stopQrScanner();
      setScannerError(error?.message || 'Unable to start QR scanner. Check camera permission.');
    }
  };

  useEffect(() => () => {
    stopQrScanner();
  }, []);

  const resetBookingFlow = () => {
    setBookingStep(1);
    setBookingData({ date: '', time: '', type: 'Clinic', symptoms: '' });
    setBookingPatientFor('self');
    setBookingPatientName(currentUser?.name || '');
    setBookingPatientPhone(currentUser?.phone || '');
    setBookingPatientEmail(currentUser?.email || '');
    setPaymentData({ paymentMethod: 'CARD', upiId: '', cardNumber: '', cardHolderName: '', expiry: '', cvv: '' });
    setRememberCard(true);
  };

  const closeBookingModal = () => {
    stopQrScanner();
    setShowBookingModal(false);
    setSelectedDoctor(null);
    resetBookingFlow();
  };

  useEffect(() => {
    let isCancelled = false;

    const loadAvailableSlots = async () => {
      if (!showBookingModal || !selectedDoctor || !bookingData.date) {
        setAvailableTimeSlots([]);
        setAvailableSlotsError('');
        setAvailableSlotsLoading(false);
        return;
      }

      try {
        setAvailableSlotsLoading(true);
        const slots = await getAvailableTimeSlots(selectedDoctor.id, bookingData.date);
        if (!isCancelled) {
          setAvailableTimeSlots(Array.isArray(slots) ? slots : []);
          setAvailableSlotsError('');
        }
      } catch (error) {
        if (!isCancelled) {
          setAvailableTimeSlots([]);
          setAvailableSlotsError(error.message || 'Unable to load available slots');
        }
      } finally {
        if (!isCancelled) {
          setAvailableSlotsLoading(false);
        }
      }
    };

    loadAvailableSlots();

    return () => {
      isCancelled = true;
    };
  }, [showBookingModal, selectedDoctor?.id, bookingData.date, getAvailableTimeSlots]);

  const handleStartBooking = () => {
    setShowDoctorModal(false);
    setShowBookingModal(true);
    resetBookingFlow();
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.date || !bookingData.time || !bookingData.symptoms || !bookingPatientName) {
      alert('Please fill in all required fields');
      return;
    }

    if (!isValidPhoneNumber(bookingPatientPhone)) {
      alert('Please enter a valid mobile number');
      return;
    }

    if (!paymentData.paymentMethod) {
      alert('Please choose payment method');
      return;
    }

    if (paymentData.paymentMethod === 'CARD') {
      if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid 16-digit card number');
        return;
      }
      if (!paymentData.cardHolderName.trim()) {
        alert('Please enter card holder name');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(paymentData.expiry)) {
        alert('Please enter card expiry in MM/YY format');
        return;
      }
      if (!/^\d{3,4}$/.test(paymentData.cvv)) {
        alert('Please enter a valid CVV');
        return;
      }
    }

    if (['UPI', 'GPAY', 'PHONEPE'].includes(paymentData.paymentMethod) && !paymentData.upiId.trim()) {
      alert('Please enter UPI ID to continue');
      return;
    }

    try {
      setPaymentLoading(true);
      const paymentResult = await processConsultationPayment(
        currentUser.id,
        selectedDoctor.id,
        selectedDoctor.fee,
        paymentData
      );

      await bookAppointment(
        selectedDoctor.id,
        currentUser.id,
        bookingData.date,
        bookingData.time,
        bookingData.type,
        bookingData.symptoms,
        {
          status: paymentResult.status,
          transactionId: paymentResult.transactionId,
          amount: selectedDoctor.fee
        },
        {
          bookingFor: bookingPatientFor,
          name: bookingPatientName,
          phone: bookingPatientPhone,
          email: bookingPatientEmail
        }
      );

      setShowBookingModal(false);
      setSelectedDoctor(null);
      setBookingData({ date: '', time: '', type: 'Clinic', symptoms: '' });
      setPaymentData({ paymentMethod: 'CARD', upiId: '', cardNumber: '', cardHolderName: '', expiry: '', cvv: '' });
      alert(`Appointment confirmed! Txn: ${paymentResult.transactionId}`);
    } catch (error) {
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelAppointment = (appointmentId) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment(appointmentId);
    }
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = (newDate, newTime) => {
    rescheduleAppointment(selectedAppointment.id, newDate, newTime);
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
  };

  const handleJoinVideoCall = async (appointment) => {
    try {
      const meetingLink = await getAppointmentMeetingLink(appointment.id);
      if (!meetingLink) {
        alert('Unable to start the video call. Please try again.');
        return;
      }
      setVideoCallAppointment(appointment);
      setVideoCallUrl(meetingLink);
      setShowVideoCallModal(true);
    } catch (error) {
      alert(error.message || 'Unable to start the video call. Please try again.');
    }
  };

  const handleCloseVideoCall = () => {
    setShowVideoCallModal(false);
    setVideoCallUrl('');
    setVideoCallAppointment(null);
  };

  const handleOrderMedicines = (prescription) => {
    const medicines = prescription.medicines.map(med => ({
      name: med.name,
      quantity: 1,
      price: Math.random() * 20 + 5 // Mock price
    }));
    setOrderBookingStep(1);
    setSelectedPrescriptionForOrder(prescription);
    setOrderMedicines(medicines);
    setOrderAddress('123 Main St, New York, NY');
    setOrderPaymentData({ paymentMethod: 'CARD', upiId: '', cardNumber: '', cardHolderName: '', expiry: '', cvv: '' });
    setOrderRememberCard(true);
    setShowMedicineOrderModal(true);
  };

  const resetOrderFlow = () => {
    stopQrScanner();
    setOrderBookingStep(1);
    setSelectedPrescriptionForOrder(null);
    setOrderMedicines([]);
    setOrderAddress('123 Main St, New York, NY');
    setOrderPaymentData({ paymentMethod: 'CARD', upiId: '', cardNumber: '', cardHolderName: '', expiry: '', cvv: '' });
    setOrderRememberCard(true);
  };

  const getOrderTotal = () => orderMedicines.reduce(
    (sum, med) => sum + Number(med.price || 0) * Number(med.quantity || 0),
    0
  );

  const resetLabUploadForm = () => {
    setLabUploadForm({
      name: '',
      type: '',
      date: new Date().toISOString().split('T')[0],
      doctor: '',
      lab: '',
      file: null,
    });
  };

  const handleLabFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setLabUploadForm((prev) => ({ ...prev, file }));
  };

  const handleUploadLabReport = async () => {
    if (!labUploadForm.name.trim() || !labUploadForm.type.trim() || !labUploadForm.date || !labUploadForm.file) {
      alert('Please fill report name, type, date and choose a file');
      return;
    }

    try {
      setLabUploadLoading(true);
      const uploadResult = await uploadLabReportFile(labUploadForm.file);

      await addLabReport(currentUser.id, {
        name: labUploadForm.name.trim(),
        type: labUploadForm.type.trim(),
        date: labUploadForm.date,
        doctor: labUploadForm.doctor.trim() || 'Not specified',
        lab: labUploadForm.lab.trim() || 'Self uploaded',
        status: 'Uploaded',
        results: {},
        fileUrl: uploadResult.fileUrl,
      });

      setShowLabUploadModal(false);
      resetLabUploadForm();
      alert('Lab report uploaded successfully');
    } catch (error) {
      alert(error.message || 'Unable to upload report. Please try again.');
    } finally {
      setLabUploadLoading(false);
    }
  };

  const triggerBrowserDownload = (url, fileName = 'download') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenReportFile = (fileUrl) => {
    if (!fileUrl) {
      alert('No uploaded file available for this report');
      return;
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadReportFile = (report) => {
    if (!report?.fileUrl) {
      alert('No uploaded file available for this report');
      return;
    }

    const ext = report.fileUrl.includes('.') ? report.fileUrl.split('.').pop().split('?')[0] : 'pdf';
    const safeName = (report.name || 'lab-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    triggerBrowserDownload(report.fileUrl, `${safeName}.${ext}`);
  };

  const handleDownloadPrescription = (prescription) => {
    const doctor = getDoctorById(prescription.doctorId);
    const lines = [
      `Prescription #${prescription.id}`,
      `Patient: ${currentUser.name}`,
      `Doctor: ${doctor?.name || 'N/A'}`,
      `Date: ${new Date(prescription.createdAt).toLocaleDateString()}`,
      '',
      `Diagnosis: ${prescription.diagnosis || 'N/A'}`,
      '',
      'Medicines:',
      ...prescription.medicines.map((med, index) => `${index + 1}. ${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}${med.instructions ? `, ${med.instructions}` : ''}`),
      '',
      `Doctor Notes: ${prescription.notes || 'N/A'}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerBrowserDownload(url, `prescription-${prescription.id}.txt`);
    URL.revokeObjectURL(url);
  };

  const handleConfirmMedicineOrder = async () => {
    if (!selectedPrescriptionForOrder) {
      return;
    }

    if (!orderAddress.trim()) {
      alert('Please enter delivery address');
      return;
    }

    if (!orderPaymentData.paymentMethod) {
      alert('Please choose payment method');
      return;
    }

    if (orderPaymentData.paymentMethod === 'CARD') {
      if (!orderPaymentData.cardNumber || orderPaymentData.cardNumber.replace(/\s/g, '').length < 16) {
        alert('Please enter a valid 16-digit card number');
        return;
      }
      if (!orderPaymentData.cardHolderName.trim()) {
        alert('Please enter card holder name');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(orderPaymentData.expiry)) {
        alert('Please enter card expiry in MM/YY format');
        return;
      }
      if (!/^\d{3,4}$/.test(orderPaymentData.cvv)) {
        alert('Please enter a valid CVV');
        return;
      }
    }

    if (['UPI', 'GPAY', 'PHONEPE'].includes(orderPaymentData.paymentMethod) && !orderPaymentData.upiId.trim()) {
      alert('Please enter UPI ID to continue');
      return;
    }

    try {
      setOrderPaymentLoading(true);
      const paymentResult = await processMedicineOrderPayment(
        currentUser.id,
        getOrderTotal(),
        orderPaymentData
      );

      await createMedicineOrder(
        selectedPrescriptionForOrder.id,
        currentUser.id,
        orderMedicines,
        orderAddress,
        {
          status: paymentResult.status,
          transactionId: paymentResult.transactionId,
          paymentMethod: paymentResult.paymentMethod,
        }
      );

      setShowMedicineOrderModal(false);
      resetOrderFlow();
      alert(`Payment successful. Order placed! Txn: ${paymentResult.transactionId}`);
    } catch (error) {
      alert(error.message || 'Medicine payment failed. Please try again.');
    } finally {
      setOrderPaymentLoading(false);
    }
  };

  // Generate available dates (next 14 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  return (
    <div className="patient-dashboard patient-dashboard-clean">
      <div className="dashboard-header">
        <div className="greeting">
          <h1>{t('welcome')}, {firstName}</h1>
          <p>{t('feeling')}</p>
          <div className="patient-status-strip">
            <span className="patient-status-chip">
              <strong>{upcomingAppointments.length}</strong> Upcoming
            </span>
            <span className="patient-status-chip">
              <strong>{prescriptions.filter(p => p.status === 'Active').length}</strong> Active Rx
            </span>
            <span className="patient-status-chip">
              <strong>{labReports.length}</strong> Reports
            </span>
          </div>
        </div>
        <div className="header-actions">
          <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          <div className="user-avatar">{userInitial}</div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>{t('notifications')}</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllNotificationsAsRead(currentUser.id)}>
                {t('markAllRead')}
              </button>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">{t('noNotifications')}</div>
            ) : (
              notifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {notification.type === 'appointment' && '📅'}
                    {notification.type === 'prescription' && '💊'}
                    {notification.type === 'labReport' && '🧪'}
                    {notification.type === 'order' && '📦'}
                    {notification.type === 'reminder' && '⏰'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-nav">
        <button
          className={`nav-tab ${activeSection === 'appointments' ? 'active' : ''}`}
          onClick={() => handleSectionChange('appointments')}
        >
          <span>📅</span> {t('appointments')}
        </button>
        <button
          className={`nav-tab ${activeSection === 'prescriptions' ? 'active' : ''}`}
          onClick={() => handleSectionChange('prescriptions')}
        >
          <span>💊</span> {t('prescriptions')}
        </button>
        <button
          className={`nav-tab ${activeSection === 'labReports' ? 'active' : ''}`}
          onClick={() => handleSectionChange('labReports')}
        >
          <span>🧪</span> {t('labReports')}
        </button>
        <button
          className={`nav-tab ${activeSection === 'orders' ? 'active' : ''}`}
          onClick={() => handleSectionChange('orders')}
        >
          <span>📦</span> {t('orders')}
        </button>
        <button
          className={`nav-tab ${activeSection === 'records' ? 'active' : ''}`}
          onClick={() => handleSectionChange('records')}
        >
          <span>📋</span> {t('healthRecords')}
        </button>
        <button
          className={`nav-tab ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => handleSectionChange('profile')}
        >
          <span>👤</span> {t('profile')}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content patient-dashboard-content">

        {/* ==================== DASHBOARD HOME ==================== */}
        {activeSection === 'dashboard' && (
          <div className="section-dashboard section-dashboard-home">
            <div className="patient-offer-banner">
              <div className="offer-content">
                <div className="offer-ribbon">SPECIAL OFFERS ON TUESDAY, THURSDAY & SATURDAY</div>
                <h3>Get consultation worth {formatInr(499)} for {formatInr(199)} only (60% OFF)</h3>
                <ul>
                  <li>Diabetology</li>
                  <li>Orthopedics</li>
                  <li>Pediatrics</li>
                  <li>Dermatology</li>
                  <li>General Medicine</li>
                </ul>
                <button className="offer-book-btn" onClick={() => handleSectionChange('appointments')}>Book Now</button>
              </div>
              <div className="offer-visual">
                <img src={dashboardHeroImage} alt="Doctor consultation" />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <div className="stat-value">{upcomingAppointments.length}</div>
                  <div className="stat-label">Upcoming Appointments</div>
                </div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-icon">💊</div>
                <div className="stat-info">
                  <div className="stat-value">{prescriptions.filter(p => p.status === 'Active').length}</div>
                  <div className="stat-label">Active Prescriptions</div>
                </div>
              </div>
              <div className="stat-card stat-info">
                <div className="stat-icon">🧪</div>
                <div className="stat-info">
                  <div className="stat-value">{labReports.length}</div>
                  <div className="stat-label">Lab Reports</div>
                </div>
              </div>
              <div className="stat-card stat-warning">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <div className="stat-value">{medicineOrders.filter(o => o.status !== 'Delivered').length}</div>
                  <div className="stat-label">Pending Orders</div>
                </div>
              </div>
            </div>

            <div className="featured-doctors-home">
              <div className="featured-doctors-head">
                <h2>Top Doctors for You</h2>
                <button className="btn-sm btn-secondary" onClick={() => handleSectionChange('appointments')}>
                  View All Doctors
                </button>
              </div>
              <div className="featured-doctors-grid">
                {doctors.slice(0, 6).map((doctor) => (
                  <div key={doctor.id} className="featured-doctor-card" onClick={() => handleSelectDoctor(doctor)}>
                    <img src={doctor.imageUrl} alt={doctor.name} className="featured-doctor-image" />
                    <div className="featured-doctor-content">
                      <h4>{doctor.name}</h4>
                      <p>{doctor.specialization}</p>
                      <div className="featured-doctor-meta">
                        <span>⭐ {doctor.rating}</span>
                        <span>{formatInr(doctor.fee)}</span>
                      </div>
                      <button
                        className="book-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDoctor(doctor);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="patient-home-columns">
              <div className="patient-home-main-column">
                {/* Next Appointment Card */}
                {nextAppointment && (
                  <div className="next-appointment-card">
                    <div className="card-badge">Next Appointment</div>
                    <div className="appointment-details">
                      <div className="doctor-info">
                        <div className="doctor-avatar">
                          <img src={getDoctorById(nextAppointment.doctorId)?.imageUrl} alt={getDoctorById(nextAppointment.doctorId)?.name} />
                        </div>
                        <div className="doctor-text">
                          <h3>{getDoctorById(nextAppointment.doctorId)?.name}</h3>
                          <p>{getDoctorById(nextAppointment.doctorId)?.specialization}</p>
                        </div>
                      </div>
                      <div className="appointment-meta">
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <span>{new Date(nextAppointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏰</span>
                          <span>{nextAppointment.time}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">{isVideoAppointment(nextAppointment) ? '📹' : '🏥'}</span>
                          <span>{nextAppointment.type} Consultation</span>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        {canJoinCall(nextAppointment) && (
                          <button className="btn-join" onClick={() => handleJoinVideoCall(nextAppointment)}>
                            <span>📹</span> Join Call
                          </button>
                        )}
                        <button className="btn-reschedule" onClick={() => handleReschedule(nextAppointment)}>
                          Reschedule
                        </button>
                        <button className="btn-cancel" onClick={() => handleCancelAppointment(nextAppointment.id)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="recent-activity">
                  <h2>Recent Activity</h2>
                  <div className="activity-list">
                    {pastAppointments.slice(0, 3).map(apt => (
                      <div key={apt.id} className="activity-item">
                        <div className="activity-icon">✅</div>
                        <div className="activity-content">
                          <div className="activity-title">
                            Consultation with {getDoctorById(apt.doctorId)?.name}
                          </div>
                          <div className="activity-date">{apt.date}</div>
                        </div>
                        <span className="activity-badge completed">Completed</span>
                      </div>
                    ))}
                    {prescriptions.slice(0, 2).map(pres => (
                      <div key={pres.id} className="activity-item">
                        <div className="activity-icon">💊</div>
                        <div className="activity-content">
                          <div className="activity-title">
                            Prescription from {getDoctorById(pres.doctorId)?.name}
                          </div>
                          <div className="activity-date">{new Date(pres.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className="activity-badge active">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="patient-home-side-column">
                {/* Quick Actions */}
                <div className="quick-actions">
                  <h2>Quick Actions</h2>
                  <div className="action-buttons">
                    <button className="action-btn" onClick={() => handleSectionChange('appointments')}>
                      <span className="action-icon">📅</span>
                      <span>Book Appointment</span>
                    </button>
                    <button className="action-btn" onClick={() => handleSectionChange('labReports')}>
                      <span className="action-icon">📤</span>
                      <span>Upload Report</span>
                    </button>
                    <button className="action-btn" onClick={() => handleSectionChange('orders')}>
                      <span className="action-icon">💊</span>
                      <span>Order Medicines</span>
                    </button>
                    <button className="action-btn" onClick={() => handleSectionChange('records')}>
                      <span className="action-icon">📋</span>
                      <span>View Records</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
                </div>
              )}

        {/* ==================== APPOINTMENTS SECTION ==================== */}
        {activeSection === 'appointments' && (
          <div className="section-appointments">
            {/* Search & Filters */}
            <div className="search-section">
              <h2>Find & Book Doctors</h2>
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search doctors by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filters-row">
                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters({...filters, specialization: e.target.value})}
                >
                  <option value="">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select
                  value={filters.consultationType}
                  onChange={(e) => setFilters({...filters, consultationType: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="Video">Video Consultation</option>
                  <option value="Clinic">Clinic Visit</option>
                </select>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>

            {/* Doctors List */}
            <div className="doctors-grid">
              {filteredDoctors.map(doctor => (
                <div key={doctor.id} className="doctor-card" onClick={() => handleSelectDoctor(doctor)}>
                  <div className="doctor-card-main">
                    <div className="doctor-avatar-large">
                      <img src={doctor.imageUrl} alt={doctor.name} />
                    </div>
                    <div className="doctor-card-body">
                      <div className="doctor-topline">
                        <h3>{doctor.name}</h3>
                        <div className="doctor-rating">
                          <span>⭐</span> {doctor.rating} ({doctor.reviews})
                        </div>
                      </div>
                      <p className="specialization">{doctor.specialization}</p>
                      <p className="experience">{doctor.experience} experience overall</p>
                      <p className="location">📍 {doctor.location}, {doctor.city}</p>
                      <div className="consultation-types">
                        {doctor.consultationType.map(type => (
                          <span key={type} className={`type-badge ${type.toLowerCase()}`}>
                            {type === 'Video' ? '📹' : '🏥'} {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="doctor-card-footer">
                    <div className="fee">
                      <span className="fee-label">Consultation fee at clinic</span>
                      <span className="fee-amount">{formatInr(doctor.fee)}</span>
                    </div>
                    <div className="doctor-cta-group">
                      <span className="availability-badge">Available Today</span>
                      <button
                        className="book-btn book-btn-video"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickBookDoctor(doctor, 'Video');
                        }}
                      >
                        Book Video Call
                      </button>
                      <button
                        className="book-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickBookDoctor(doctor, 'Clinic');
                        }}
                      >
                        Book Clinic Visit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Appointments */}
            <div className="appointments-section">
              <h2>📅 Upcoming Appointments ({upcomingAppointments.length})</h2>
              {upcomingAppointments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>No Upcoming Appointments</h3>
                  <p>Book an appointment with a doctor above</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {upcomingAppointments.map(apt => {
                    const doctor = getDoctorById(apt.doctorId);
                    return (
                      <div key={apt.id} className="appointment-card">
                        <div className="apt-doctor">
                          <div className="apt-avatar">
                            <img src={doctor?.imageUrl} alt={doctor?.name} />
                          </div>
                          <div className="apt-info">
                            <h4>{doctor?.name}</h4>
                            <p>{doctor?.specialization}</p>
                          </div>
                        </div>
                        <div className="apt-details">
                          <div className="apt-detail">
                            <span>📅</span> {apt.date}
                          </div>
                          <div className="apt-detail">
                            <span>⏰</span> {apt.time}
                          </div>
                          <div className="apt-detail">
                            <span>{isVideoAppointment(apt) ? '📹' : '🏥'}</span> {apt.type}
                          </div>
                        </div>
                        <div className={`apt-status status-${apt.status.toLowerCase()}`}>
                          {apt.status}
                        </div>
                        <div className="apt-actions">
                          {canJoinCall(apt) && (
                            <button className="btn-sm btn-primary" onClick={() => handleJoinVideoCall(apt)}>Join Call</button>
                          )}
                          <button className="btn-sm btn-secondary" onClick={() => handleReschedule(apt)}>
                            Reschedule
                          </button>
                          <button className="btn-sm btn-danger" onClick={() => handleCancelAppointment(apt.id)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            <div className="appointments-section">
              <h2>📜 Past Appointments ({pastAppointments.length})</h2>
              {pastAppointments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <h3>No Past Appointments</h3>
                </div>
              ) : (
                <div className="appointments-list">
                  {pastAppointments.map(apt => {
                    const doctor = getDoctorById(apt.doctorId);
                    return (
                      <div key={apt.id} className="appointment-card past">
                        <div className="apt-doctor">
                          <div className="apt-avatar">
                            <img src={doctor?.imageUrl} alt={doctor?.name} />
                          </div>
                          <div className="apt-info">
                            <h4>{doctor?.name}</h4>
                            <p>{doctor?.specialization}</p>
                          </div>
                        </div>
                        <div className="apt-details">
                          <div className="apt-detail">
                            <span>📅</span> {apt.date}
                          </div>
                          {apt.diagnosis && (
                            <div className="apt-detail">
                              <span>🩺</span> {apt.diagnosis}
                            </div>
                          )}
                        </div>
                        <div className={`apt-status status-completed`}>
                          Completed
                        </div>
                        <div className="apt-actions">
                          {apt.prescriptionId && (
                            <button className="btn-sm btn-secondary" onClick={() => handleSectionChange('prescriptions')}>
                              View Prescription
                            </button>
                          )}
                          <button className="btn-sm btn-primary" onClick={() => handleSelectDoctor(doctor)}>
                            Book Again
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== PRESCRIPTIONS SECTION ==================== */}
        {activeSection === 'prescriptions' && (
          <div className="section-prescriptions">
            <h2>💊 My Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💊</span>
                <h3>No Prescriptions</h3>
                <p>Your prescriptions will appear here after consultations</p>
              </div>
            ) : (
              <div className="prescriptions-grid">
                {prescriptions.map(pres => {
                  const doctor = getDoctorById(pres.doctorId);
                  return (
                    <div key={pres.id} className="prescription-card">
                      <div className="pres-header">
                        <div className="pres-id">Prescription #{pres.id}</div>
                        <div className={`pres-status status-${pres.status.toLowerCase()}`}>
                          {pres.status}
                        </div>
                      </div>
                      <div className="pres-doctor">
                        <span>👨‍⚕️</span> {doctor?.name}
                      </div>
                      <div className="pres-date">
                        <span>📅</span> {new Date(pres.createdAt).toLocaleDateString()}
                      </div>
                      {pres.diagnosis && (
                        <div className="pres-diagnosis">
                          <span>🩺</span> Diagnosis: {pres.diagnosis}
                        </div>
                      )}
                      <div className="pres-medicines">
                        <h4>Medicines</h4>
                        <ul>
                          {pres.medicines.map((med, idx) => (
                            <li key={idx}>
                              <div className="med-name">💊 {med.name}</div>
                              <div className="med-details">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </div>
                              {med.instructions && (
                                <div className="med-instructions">📝 {med.instructions}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {pres.notes && (
                        <div className="pres-notes">
                          <h4>Doctor's Notes</h4>
                          <p>{pres.notes}</p>
                        </div>
                      )}
                      <div className="pres-actions">
                        <button className="btn-download" onClick={() => handleDownloadPrescription(pres)}>
                          <span>📄</span> Download PDF
                        </button>
                        <button className="btn-order" onClick={() => handleOrderMedicines(pres)}>
                          <span>🛒</span> Order Medicines
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== LAB REPORTS SECTION ==================== */}
        {activeSection === 'labReports' && (
          <div className="section-lab-reports">
            <div className="section-header">
              <h2>🧪 Lab Reports</h2>
              <button className="btn-upload" onClick={() => setShowLabUploadModal(true)}>
                <span>📤</span> Upload Report
              </button>
            </div>
            {labReports.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🧪</span>
                <h3>No Lab Reports</h3>
                <p>Upload your lab reports to keep track of your health</p>
              </div>
            ) : (
              <div className="reports-grid">
                {labReports.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-icon">📋</div>
                    <div className="report-info">
                      <h4>{report.name}</h4>
                      <p className="report-type">{report.type}</p>
                      <p className="report-date">📅 {report.date}</p>
                      <p className="report-doctor">👨‍⚕️ {report.doctor}</p>
                      <p className="report-lab">🏥 {report.lab}</p>
                    </div>
                    {report.results && (
                      <div className="report-results">
                        <h5>Results</h5>
                        <div className="results-grid">
                          {Object.entries(report.results).map(([key, value]) => (
                            <div key={key} className="result-item">
                              <span className="result-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="result-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="report-actions">
                      <button className="btn-view" onClick={() => handleOpenReportFile(report.fileUrl)}>👁️ View</button>
                      <button className="btn-download" onClick={() => handleDownloadReportFile(report)}>📥 Download</button>
                      <button className="btn-share">📤 Share</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== MEDICINE ORDERS SECTION ==================== */}
        {activeSection === 'orders' && (
          <div className="section-orders">
            <h2>📦 Medicine Orders</h2>
            {medicineOrders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h3>No Orders Yet</h3>
                <p>Order medicines from your prescriptions</p>
              </div>
            ) : (
              <div className="orders-list">
                {medicineOrders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">
                        <span className="order-icon">📦</span>
                        Order #{order.trackingId}
                      </div>
                      <div className={`order-status status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="order-timeline">
                      <div className={`timeline-step ${['Processing', 'Shipped', 'Delivered'].includes(order.status) ? 'completed' : ''}`}>
                        <span>📝</span> Order Placed
                      </div>
                      <div className={`timeline-step ${['Shipped', 'Delivered'].includes(order.status) ? 'completed' : ''}`}>
                        <span>📦</span> Shipped
                      </div>
                      <div className={`timeline-step ${order.status === 'Delivered' ? 'completed' : ''}`}>
                        <span>✅</span> Delivered
                      </div>
                    </div>
                    <div className="order-medicines">
                      <h4>Items</h4>
                      {order.medicines.map((med, idx) => (
                        <div key={idx} className="order-med-item">
                          <span>💊 {med.name}</span>
                          <span>x{med.quantity}</span>
                          <span>{formatInr(med.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <div className="order-total">
                        Total: <strong>{formatInr(order.totalAmount)}</strong>
                      </div>
                      <div className="order-dates">
                        <span>💳 Payment: {order.paymentStatus || 'PENDING'} ({order.paymentMethod || 'N/A'})</span>
                        {order.paymentTransactionId && <span>🧾 Txn: {order.paymentTransactionId}</span>}
                      </div>
                      <div className="order-dates">
                        <span>📅 Ordered: {order.orderDate}</span>
                        {order.deliveryDate && <span>🚚 Delivered: {order.deliveryDate}</span>}
                      </div>
                      <div className="order-actions">
                        <button className="btn-track">🔍 Track Order</button>
                        {order.status === 'Delivered' && <button className="btn-reorder">🔄 Re-order</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== HEALTH RECORDS SECTION ==================== */}
        {activeSection === 'records' && (
          <div className="section-records">
            <h2>📋 Health Records</h2>
            <div className="records-timeline">
              {healthRecords.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <h3>No Health Records</h3>
                  <p>Your medical history will be tracked here</p>
                </div>
              ) : (
                healthRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => (
                  <div key={record.id} className="record-item">
                    <div className="record-date-marker">
                      <div className="record-month">{new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="record-day">{new Date(record.date).getDate()}</div>
                      <div className="record-year">{new Date(record.date).getFullYear()}</div>
                    </div>
                    <div className="record-content">
                      <div className={`record-type-badge type-${record.type.toLowerCase()}`}>
                        {record.type === 'Diagnosis' && '🩺'}
                        {record.type === 'Vaccination' && '💉'}
                        {record.type === 'Surgery' && '🏥'}
                        {record.type === 'Allergy' && '⚠️'}
                        {record.type}
                      </div>
                      <h4>{record.title}</h4>
                      <p>{record.description}</p>
                      <div className="record-doctor">👨‍⚕️ {record.doctor}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== PROFILE SECTION ==================== */}
        {activeSection === 'profile' && (
          <div className="section-profile">
            <h2>👤 My Profile</h2>
            <div className="profile-grid">
              {/* Personal Info */}
              <div className="profile-card">
                <h3>Personal Information</h3>
                <div className="profile-field">
                  <label>Full Name</label>
                  <div className="field-value">{currentUser.name}</div>
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <div className="field-value">{currentUser.email}</div>
                </div>
                <div className="profile-field">
                  <label>Phone</label>
                  <div className="field-value">{currentUser.phone || 'Not provided'}</div>
                </div>
                {currentUser.profile && (
                  <>
                    <div className="profile-row">
                      <div className="profile-field">
                        <label>Age</label>
                        <div className="field-value">{currentUser.profile.age || 'Not provided'}</div>
                      </div>
                      <div className="profile-field">
                        <label>Gender</label>
                        <div className="field-value">{currentUser.profile.gender || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="profile-row">
                      <div className="profile-field">
                        <label>Blood Group</label>
                        <div className="field-value">{currentUser.profile.bloodGroup || 'Not provided'}</div>
                      </div>
                      <div className="profile-field">
                        <label>Height</label>
                        <div className="field-value">{currentUser.profile.height || 'Not provided'}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Health Summary */}
              {currentUser.profile && (
                <div className="profile-card">
                  <h3>Health Summary</h3>
                  <div className="profile-field">
                    <label>Allergies</label>
                    <div className="tags-list">
                      {currentUser.profile.allergies?.length > 0 ? (
                        currentUser.profile.allergies.map((allergy, idx) => (
                          <span key={idx} className="tag tag-danger">{allergy}</span>
                        ))
                      ) : (
                        <span className="no-data">No known allergies</span>
                      )}
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Medical Conditions</label>
                    <div className="tags-list">
                      {currentUser.profile.conditions?.length > 0 ? (
                        currentUser.profile.conditions.map((condition, idx) => (
                          <span key={idx} className="tag tag-warning">{condition}</span>
                        ))
                      ) : (
                        <span className="no-data">No conditions</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {currentUser.profile?.emergencyContact && (
                <div className="profile-card">
                  <h3>Emergency Contact</h3>
                  <div className="profile-field">
                    <label>Name</label>
                    <div className="field-value">{currentUser.profile.emergencyContact.name || 'Not provided'}</div>
                  </div>
                  <div className="profile-field">
                    <label>Phone</label>
                    <div className="field-value">{currentUser.profile.emergencyContact.phone || 'Not provided'}</div>
                  </div>
                  <div className="profile-field">
                    <label>Relation</label>
                    <div className="field-value">{currentUser.profile.emergencyContact.relation || 'Not provided'}</div>
                  </div>
                </div>
              )}

              {/* Insurance */}
              {currentUser.profile?.insurance && (
                <div className="profile-card">
                  <h3>Insurance Details</h3>
                  <div className="profile-field">
                    <label>Provider</label>
                    <div className="field-value">{currentUser.profile.insurance.provider || 'Not provided'}</div>
                  </div>
                  <div className="profile-field">
                    <label>Policy Number</label>
                    <div className="field-value">{currentUser.profile.insurance.policyNo || 'Not provided'}</div>
                  </div>
                  <div className="profile-field">
                    <label>Valid Till</label>
                    <div className="field-value">{currentUser.profile.insurance.validTill || 'Not provided'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
            </div>

      {showLabUploadModal && (
        <div className="modal-overlay" onClick={() => !labUploadLoading && setShowLabUploadModal(false)}>
          <div className="modal lab-upload-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => !labUploadLoading && setShowLabUploadModal(false)}>×</button>
            <div className="lab-upload-header">
              <h2>Upload Lab Report</h2>
              <p>Attach your report file and details. Supported formats: PDF, PNG, JPG</p>
            </div>
            <div className="lab-upload-body">
              <div className="form-group">
                <label className="form-label">Report Name *</label>
                <input
                  className="form-input"
                  type="text"
                  value={labUploadForm.name}
                  onChange={(e) => setLabUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="CBC, Thyroid Profile, MRI Scan..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Report Type *</label>
                <input
                  className="form-input"
                  type="text"
                  value={labUploadForm.type}
                  onChange={(e) => setLabUploadForm((prev) => ({ ...prev, type: e.target.value }))}
                  placeholder="Blood Test, X-Ray, CT Scan..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Report Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={labUploadForm.date}
                  onChange={(e) => setLabUploadForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Doctor</label>
                <input
                  className="form-input"
                  type="text"
                  value={labUploadForm.doctor}
                  onChange={(e) => setLabUploadForm((prev) => ({ ...prev, doctor: e.target.value }))}
                  placeholder="Doctor name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lab / Hospital</label>
                <input
                  className="form-input"
                  type="text"
                  value={labUploadForm.lab}
                  onChange={(e) => setLabUploadForm((prev) => ({ ...prev, lab: e.target.value }))}
                  placeholder="Lab or hospital name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload File *</label>
                <input
                  className="form-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleLabFileChange}
                />
                {labUploadForm.file && (
                  <p className="lab-file-name">Selected: {labUploadForm.file.name}</p>
                )}
              </div>

              <div className="lab-upload-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (!labUploadLoading) {
                      setShowLabUploadModal(false);
                      resetLabUploadForm();
                    }
                  }}
                  disabled={labUploadLoading}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUploadLabReport} disabled={labUploadLoading}>
                  {labUploadLoading ? 'Uploading...' : 'Upload Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DOCTOR DETAIL MODAL ==================== */}
      {showDoctorModal && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
          <div className="modal doctor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDoctorModal(false)}>×</button>
            <div className="doctor-profile">
              <div className="doctor-profile-header">
                <div className="doctor-profile-avatar">
                  <img src={selectedDoctor.imageUrl} alt={selectedDoctor.name} />
                </div>
                <div className="doctor-profile-info">
                  <h2>{selectedDoctor.name}</h2>
                  <p className="doctor-spec">{selectedDoctor.specialization}</p>
                  <p className="doctor-exp">{selectedDoctor.experience} experience</p>
                  <div className="doctor-rating-large">
                    <span>⭐ {selectedDoctor.rating}</span>
                    <span>({selectedDoctor.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="doctor-profile-body">
                <div className="profile-section">
                  <h4>About</h4>
                  <p>{selectedDoctor.about}</p>
                </div>
                <div className="profile-section">
                  <h4>Education</h4>
                  <p>{selectedDoctor.education}</p>
                </div>
                <div className="profile-section">
                  <h4>Location</h4>
                  <p>📍 {selectedDoctor.location}, {selectedDoctor.city}</p>
                </div>
                <div className="profile-section">
                  <h4>Languages</h4>
                  <div className="tags-list">
                    {(selectedDoctor.languages || ['English']).map(lang => (
                      <span key={lang} className="tag">{lang}</span>
                    ))}
                  </div>
                </div>
                <div className="profile-section">
                  <h4>Consultation Types</h4>
                  <div className="tags-list">
                    {selectedDoctor.consultationType.map(type => (
                      <span key={type} className={`tag tag-${type.toLowerCase()}`}>
                        {type === 'Video' ? '📹' : '🏥'} {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="profile-section">
                  <h4>Consultation Fee</h4>
                  <p className="fee-large">{formatInr(selectedDoctor.fee)}</p>
                </div>
              </div>
              <div className="doctor-profile-footer">
                <button className="btn-book-large" onClick={handleStartBooking}>
                  <span>📅</span> Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOOKING MODAL ==================== */}
      {showBookingModal && selectedDoctor && (
        <div className="modal-overlay" onClick={closeBookingModal}>
          <div className="modal booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeBookingModal}>×</button>
            <div className="booking-header">
              <h2>Book Appointment</h2>
              <p>with {selectedDoctor.name}</p>
            </div>
            
            <div className="booking-steps">
              <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>1. Type</div>
              <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>2. Slot</div>
              <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>3. Patient Details</div>
              <div className={`step ${bookingStep >= 4 ? 'active' : ''}`}>4. Payment</div>
            </div>

            {bookingStep === 1 && (
              <div className="booking-step-content">
                <h3>Select Consultation Type</h3>
                <div className="consultation-types-select">
                  {selectedDoctor.consultationType.map(type => (
                    <label 
                      key={type} 
                      className={`type-option ${bookingData.type === type ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={bookingData.type === type}
                        onChange={(e) => setBookingData({...bookingData, type: e.target.value})}
                      />
                      <span className="type-icon">{type === 'Video' ? '📹' : '🏥'}</span>
                      <span className="type-name">{type} Consultation</span>
                      <span className="type-desc">
                        {type === 'Video' ? 'Connect online via video call' : 'Visit the clinic in person'}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="step-buttons">
                  <button className="btn-back" onClick={closeBookingModal}>
                    <span>←</span> Cancel
                  </button>
                  <button className="btn-next" onClick={() => setBookingStep(2)}>
                    Continue <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="booking-step-content">
                <h3>Book an appointment for consultation</h3>
                <div className="date-picker">
                  <h4>Choose a day</h4>
                  <div className="dates-grid">
                    {getAvailableDates().slice(0, 7).map(date => (
                      <button
                        key={date}
                        className={`date-btn ${bookingData.date === date ? 'selected' : ''}`}
                        onClick={() => setBookingData({...bookingData, date, time: ''})}
                      >
                        <span className="date-day">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="date-num">{new Date(date).getDate()}</span>
                        <span className="date-month">{new Date(date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {bookingData.date && (
                  <div className="time-picker">
                    <h4>Evening slots</h4>
                    {availableSlotsLoading ? (
                      <div className="slot-status-message">Loading available slots...</div>
                    ) : availableSlotsError ? (
                      <div className="slot-status-message error">{availableSlotsError}</div>
                    ) : availableTimeSlots.length === 0 ? (
                      <div className="slot-status-message">No slots available for this day</div>
                    ) : (
                      <div className="times-grid">
                        {availableTimeSlots.map(time => (
                          <button
                            key={time}
                            className={`time-btn ${bookingData.time === time ? 'selected' : ''}`}
                            onClick={() => setBookingData({...bookingData, time})}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="step-buttons">
                  <button className="btn-back" onClick={() => setBookingStep(1)}>
                    <span>←</span> Back
                  </button>
                  <button 
                    className="btn-next" 
                    onClick={() => setBookingStep(3)}
                    disabled={!bookingData.date || !bookingData.time}
                  >
                    Continue <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="booking-step-content">
                <div className="booking-final-layout">
                  <div className="booking-left-panel">
                    <h3>In-{bookingData.type.toLowerCase()} appointment</h3>
                    <div className="booking-summary appointment-summary-card">
                      <div className="summary-row">
                        <span>Date</span>
                        <span>{new Date(bookingData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="summary-row">
                        <span>Time</span>
                        <span>{bookingData.time}</span>
                      </div>
                      <div className="summary-row">
                        <span>Doctor</span>
                        <span>{selectedDoctor.name}</span>
                      </div>
                      <div className="summary-row">
                        <span>Specialization</span>
                        <span>{selectedDoctor.specialization}</span>
                      </div>
                      <div className="summary-row">
                        <span>Location</span>
                        <span>{selectedDoctor.location}, {selectedDoctor.city}</span>
                      </div>
                      <div className="summary-row">
                        <span>Consultation fee</span>
                        <span className="fee-highlight">{formatInr(selectedDoctor.fee)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-right-panel">
                    <h3>Patient Details</h3>
                    <div className="patient-choice-card">
                      <label className="patient-choice-option">
                        <input
                          type="radio"
                          name="patientFor"
                          value="self"
                          checked={bookingPatientFor === 'self'}
                          onChange={() => {
                            setBookingPatientFor('self');
                            setBookingPatientName(currentUser?.name || '');
                            setBookingPatientPhone(currentUser?.phone || '');
                            setBookingPatientEmail(currentUser?.email || '');
                          }}
                        />
                        <span>{currentUser.name}</span>
                      </label>
                      <label className="patient-choice-option">
                        <input
                          type="radio"
                          name="patientFor"
                          value="other"
                          checked={bookingPatientFor === 'other'}
                          onChange={() => {
                            setBookingPatientFor('other');
                            setBookingPatientName('');
                            setBookingPatientPhone('');
                            setBookingPatientEmail('');
                          }}
                        />
                        <span>Someone Else</span>
                      </label>
                    </div>

                    <div className="symptoms-input">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={bookingPatientName}
                        onChange={(e) => setBookingPatientName(e.target.value)}
                        placeholder="Enter patient full name"
                      />
                    </div>

                    <div className="symptoms-input">
                      <label>Mobile *</label>
                      <input
                        type="tel"
                        value={bookingPatientPhone}
                        onChange={(e) => setBookingPatientPhone(e.target.value)}
                        placeholder="+91XXXXXXXXXX"
                      />
                    </div>

                    <div className="symptoms-input">
                      <label>Your Email</label>
                      <input
                        type="email"
                        value={bookingPatientEmail}
                        onChange={(e) => setBookingPatientEmail(e.target.value)}
                        placeholder="Enter your email (optional)"
                      />
                    </div>

                    <div className="symptoms-input">
                      <label>Reason for visit *</label>
                      <textarea
                        value={bookingData.symptoms}
                        onChange={(e) => setBookingData({...bookingData, symptoms: e.target.value})}
                        placeholder="Describe symptoms or reason for consultation"
                        rows="3"
                      />
                    </div>

                  </div>
                </div>

                <div className="step-buttons">
                  <button className="btn-back" onClick={() => setBookingStep(2)}>
                    <span>←</span> Back
                  </button>
                  <button
                    className="btn-next"
                    onClick={() => setBookingStep(4)}
                    disabled={!bookingData.symptoms || !bookingPatientName || !bookingPatientPhone}
                  >
                    Continue To Payment <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 4 && (
              <div className="booking-step-content payment-step-content">
                <div className="payment-header-bar">Amount to Pay: {formatInr(selectedDoctor.fee)}</div>
                <div className="payment-gateway-layout">
                  <div className="payment-options-list">
                    {[
                      ['CARD', 'Debit / Credit Card'],
                      ['WALLET', 'Paytm Postpaid and Wallet'],
                      ['UPI', 'UPI'],
                      ['GPAY', 'Google Pay'],
                      ['AMAZON_PAY', 'Amazon Pay'],
                      ['PHONEPE', 'PhonePe / BHIM UPI'],
                      ['NET_BANKING', 'Net Banking'],
                      ['PAY_LATER', 'Pay Later'],
                      ['OTHERS', 'Others']
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className={`payment-option-item ${paymentData.paymentMethod === key ? 'active' : ''}`}
                        onClick={() => setPaymentData({ ...paymentData, paymentMethod: key })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="payment-form-panel">
                    {paymentData.paymentMethod === 'CARD' && (
                      <div className="card-payment-form">
                        <label>CARD NUMBER</label>
                        <input
                          type="text"
                          placeholder="XXXX - XXXX - XXXX - XXXX"
                          value={paymentData.cardNumber}
                          onChange={(e) => setPaymentData({ ...paymentData, cardNumber: normalizeCardNumber(e.target.value) })}
                        />

                        <label>CARD HOLDER'S NAME</label>
                        <input
                          type="text"
                          placeholder="Eg: John Doe"
                          value={paymentData.cardHolderName}
                          onChange={(e) => setPaymentData({ ...paymentData, cardHolderName: e.target.value })}
                        />

                        <div className="card-inline-fields">
                          <div>
                            <label>VALID UPTO</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={paymentData.expiry}
                              onChange={(e) => setPaymentData({ ...paymentData, expiry: normalizeExpiry(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label>ENTER CVV</label>
                            <input
                              type="password"
                              placeholder="CVV"
                              value={paymentData.cvv}
                              onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            />
                          </div>
                        </div>

                        <label className="remember-card-row">
                          <input
                            type="checkbox"
                            checked={rememberCard}
                            onChange={(e) => setRememberCard(e.target.checked)}
                          />
                          <span>Remember this card (Your CVV won't be saved)</span>
                        </label>
                      </div>
                    )}

                    {['UPI', 'GPAY', 'PHONEPE'].includes(paymentData.paymentMethod) && (
                      <div className="card-payment-form">
                        <label>UPI ID</label>
                        <input
                          type="text"
                          placeholder="example@upi"
                          value={paymentData.upiId}
                          onChange={(e) => setPaymentData({ ...paymentData, upiId: e.target.value })}
                        />
                        <div className="upi-scanner-actions">
                          <button type="button" className="btn-view-record" onClick={() => startQrScanner('consultation')}>
                            Scan UPI QR
                          </button>
                          {activeScanner === 'consultation' && (
                            <button type="button" className="btn-view-record" onClick={stopQrScanner}>
                              Stop Scanner
                            </button>
                          )}
                        </div>
                        {activeScanner === 'consultation' && (
                          <div className="upi-scanner-panel">
                            <video ref={scannerVideoRef} className="upi-scanner-video" muted playsInline />
                            <p>Point camera at any UPI QR. UPI ID will auto-fill.</p>
                          </div>
                        )}
                        {scannerError && <p className="payment-note payment-note-error">{scannerError}</p>}
                        <p className="payment-note">
                          Real transfer to doctor account works only after live gateway setup on backend.
                        </p>
                      </div>
                    )}

                    {!['CARD', 'UPI', 'GPAY', 'PHONEPE'].includes(paymentData.paymentMethod) && (
                      <div className="card-payment-form">
                        <label>PAYMENT</label>
                        <p className="payment-note">You selected {paymentData.paymentMethod.replace('_', ' ')}. Click Pay to continue.</p>
                      </div>
                    )}

                    <button className="pay-now-btn" onClick={handleConfirmBooking} disabled={paymentLoading}>
                      {paymentLoading ? 'Processing Payment...' : 'Pay'}
                    </button>
                  </div>
                </div>

                <div className="step-buttons">
                  <button className="btn-back" onClick={() => setBookingStep(3)}>
                    <span>←</span> Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MEDICINE ORDER PAYMENT MODAL ==================== */}
      {showMedicineOrderModal && selectedPrescriptionForOrder && (
        <div className="modal-overlay" onClick={() => { if (!orderPaymentLoading) { setShowMedicineOrderModal(false); resetOrderFlow(); } }}>
          <div className="modal booking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { if (!orderPaymentLoading) { setShowMedicineOrderModal(false); resetOrderFlow(); } }}>×</button>
            <div className="booking-header">
              <h2>Order Medicines</h2>
              <p>Prescription #{selectedPrescriptionForOrder.id}</p>
            </div>

            <div className="booking-steps">
              <div className={`step ${orderBookingStep >= 1 ? 'active' : ''}`}>1. Order Details</div>
              <div className={`step ${orderBookingStep >= 2 ? 'active' : ''}`}>2. Payment</div>
            </div>

            {orderBookingStep === 1 && (
              <div className="booking-step-content">
                <h3>Order Summary</h3>
                <div className="booking-summary">
                  {orderMedicines.map((med, idx) => (
                    <div key={`${med.name}-${idx}`} className="summary-row">
                      <span>{med.name} x{med.quantity}</span>
                      <span>{formatInr(Number(med.price || 0) * Number(med.quantity || 0))}</span>
                    </div>
                  ))}
                  <div className="summary-row">
                    <span>Total Amount</span>
                    <span className="fee-highlight">{formatInr(getOrderTotal())}</span>
                  </div>
                </div>

                <div className="symptoms-input">
                  <label>Delivery Address *</label>
                  <textarea
                    value={orderAddress}
                    onChange={(e) => setOrderAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    rows="3"
                  />
                </div>

                <div className="step-buttons">
                  <button className="btn-back" onClick={() => { setShowMedicineOrderModal(false); resetOrderFlow(); }}>
                    <span>←</span> Cancel
                  </button>
                  <button className="btn-next" onClick={() => setOrderBookingStep(2)} disabled={!orderAddress.trim() || orderMedicines.length === 0}>
                    Continue To Payment <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {orderBookingStep === 2 && (
              <div className="booking-step-content payment-step-content">
                <div className="payment-header-bar">Amount to Pay: {formatInr(getOrderTotal())}</div>
                <div className="payment-gateway-layout">
                  <div className="payment-options-list">
                    {[
                      ['CARD', 'Debit / Credit Card'],
                      ['WALLET', 'Paytm Postpaid and Wallet'],
                      ['UPI', 'UPI'],
                      ['GPAY', 'Google Pay'],
                      ['AMAZON_PAY', 'Amazon Pay'],
                      ['PHONEPE', 'PhonePe / BHIM UPI'],
                      ['NET_BANKING', 'Net Banking'],
                      ['PAY_LATER', 'Pay Later'],
                      ['OTHERS', 'Others']
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className={`payment-option-item ${orderPaymentData.paymentMethod === key ? 'active' : ''}`}
                        onClick={() => setOrderPaymentData({ ...orderPaymentData, paymentMethod: key })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="payment-form-panel">
                    {orderPaymentData.paymentMethod === 'CARD' && (
                      <div className="card-payment-form">
                        <label>CARD NUMBER</label>
                        <input
                          type="text"
                          placeholder="XXXX - XXXX - XXXX - XXXX"
                          value={orderPaymentData.cardNumber}
                          onChange={(e) => setOrderPaymentData({ ...orderPaymentData, cardNumber: normalizeCardNumber(e.target.value) })}
                        />

                        <label>CARD HOLDER'S NAME</label>
                        <input
                          type="text"
                          placeholder="Eg: John Doe"
                          value={orderPaymentData.cardHolderName}
                          onChange={(e) => setOrderPaymentData({ ...orderPaymentData, cardHolderName: e.target.value })}
                        />

                        <div className="card-inline-fields">
                          <div>
                            <label>VALID UPTO</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={orderPaymentData.expiry}
                              onChange={(e) => setOrderPaymentData({ ...orderPaymentData, expiry: normalizeExpiry(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label>ENTER CVV</label>
                            <input
                              type="password"
                              placeholder="CVV"
                              value={orderPaymentData.cvv}
                              onChange={(e) => setOrderPaymentData({ ...orderPaymentData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            />
                          </div>
                        </div>

                        <label className="remember-card-row">
                          <input
                            type="checkbox"
                            checked={orderRememberCard}
                            onChange={(e) => setOrderRememberCard(e.target.checked)}
                          />
                          <span>Remember this card (Your CVV won't be saved)</span>
                        </label>
                      </div>
                    )}

                    {['UPI', 'GPAY', 'PHONEPE'].includes(orderPaymentData.paymentMethod) && (
                      <div className="card-payment-form">
                        <label>UPI ID</label>
                        <input
                          type="text"
                          placeholder="example@upi"
                          value={orderPaymentData.upiId}
                          onChange={(e) => setOrderPaymentData({ ...orderPaymentData, upiId: e.target.value })}
                        />
                        <div className="upi-scanner-actions">
                          <button type="button" className="btn-view-record" onClick={() => startQrScanner('order')}>
                            Scan UPI QR
                          </button>
                          {activeScanner === 'order' && (
                            <button type="button" className="btn-view-record" onClick={stopQrScanner}>
                              Stop Scanner
                            </button>
                          )}
                        </div>
                        {activeScanner === 'order' && (
                          <div className="upi-scanner-panel">
                            <video ref={scannerVideoRef} className="upi-scanner-video" muted playsInline />
                            <p>Point camera at any UPI QR. UPI ID will auto-fill.</p>
                          </div>
                        )}
                        {scannerError && <p className="payment-note payment-note-error">{scannerError}</p>}
                        <p className="payment-note">
                          Real transfer to doctor account works only after live gateway setup on backend.
                        </p>
                      </div>
                    )}

                    {!['CARD', 'UPI', 'GPAY', 'PHONEPE'].includes(orderPaymentData.paymentMethod) && (
                      <div className="card-payment-form">
                        <label>PAYMENT</label>
                        <p className="payment-note">You selected {orderPaymentData.paymentMethod.replace('_', ' ')}. Click Pay to continue.</p>
                      </div>
                    )}

                    <button className="pay-now-btn" onClick={handleConfirmMedicineOrder} disabled={orderPaymentLoading || orderMedicines.length === 0}>
                      {orderPaymentLoading ? 'Processing Payment...' : 'Pay & Place Order'}
                    </button>
                  </div>
                </div>

                <div className="step-buttons">
                  <button className="btn-back" onClick={() => setOrderBookingStep(1)}>
                    <span>←</span> Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== RESCHEDULE MODAL ==================== */}
      {showRescheduleModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal reschedule-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>×</button>
            <h2>Reschedule Appointment</h2>
            <div className="reschedule-content">
              <div className="current-schedule">
                <h4>Current Schedule</h4>
                <p>📅 {selectedAppointment.date} at {selectedAppointment.time}</p>
              </div>
              <div className="new-schedule">
                <h4>Select New Date & Time</h4>
                <div className="dates-grid">
                  {getAvailableDates().slice(0, 7).map(date => (
                    <button
                      key={date}
                      className={`date-btn ${bookingData.date === date ? 'selected' : ''}`}
                      onClick={() => setBookingData({...bookingData, date})}
                    >
                      <span className="date-day">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="date-num">{new Date(date).getDate()}</span>
                    </button>
                  ))}
                </div>
                {bookingData.date && (
                  <div className="times-grid">
                    {timeSlots.slice(0, 6).map(time => (
                      <button
                        key={time}
                        className={`time-btn ${bookingData.time === time ? 'selected' : ''}`}
                        onClick={() => setBookingData({...bookingData, time})}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button 
                className="btn-confirm"
                onClick={() => handleConfirmReschedule(bookingData.date, bookingData.time)}
                disabled={!bookingData.date || !bookingData.time}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoCallModal && videoCallUrl && (
        <div className="modal-overlay" onClick={handleCloseVideoCall}>
          <div
            className="modal"
            style={{ maxWidth: '1100px', width: '95%', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h3 style={{ margin: 0 }}>Live Video Consultation</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                  {videoCallAppointment ? `Appointment #${videoCallAppointment.id}` : 'Live call session'}
                </p>
                <p style={{ margin: '4px 0 0', color: '#1d4ed8', fontSize: '12px' }}>
                  Meeting link is auto-generated by the system for this appointment.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-sm btn-secondary" onClick={() => window.open(videoCallUrl, '_blank', 'noopener,noreferrer')}>
                  Open in New Tab
                </button>
                <button className="btn-sm btn-danger" onClick={handleCloseVideoCall}>End Call</button>
              </div>
            </div>
            <iframe
              title="Patient Video Consultation"
              src={videoCallUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ border: 0, width: '100%', height: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
