import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const DoctorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentUser,
    doctors,
    getTodayAppointmentsForDoctor,
    getPendingRequestsForDoctor,
    getUpcomingAppointmentsForDoctor,
    getCompletedAppointmentsForDoctor,
    getPrescriptionsByDoctor,
    getPatientsForDoctor,
    getPatientHistoryForDoctor,
    getLabReportsByPatient,
    getHealthRecordsByPatient,
    addLabReport,
    getPrescriptionsByPatient,
    getNotificationsByUser,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptAppointment,
    rejectAppointment,
    completeConsultation,
    addPrescription,
    getPrescriptionSuggestions,
    getAppointmentMeetingLink,
    updateDoctorProfile,
    updateDoctorAvailability,
    getUserById,
    getDoctorById,
  } = useAppContext();
  const { selectedLanguage, setSelectedLanguage, languageOptions, t } = useLanguage();

  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'dashboard');

  // Sync activeSection with URL params
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Update URL when activeSection changes
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  const [activeAppointmentTab, setActiveAppointmentTab] = useState('pending');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPatientRecordsModal, setShowPatientRecordsModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [videoCallUrl, setVideoCallUrl] = useState('');
  const [copiedVideoCallLink, setCopiedVideoCallLink] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecordTab, setPatientRecordTab] = useState('appointments');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');

  // Get doctor profile
  const doctorProfile = getDoctorById(currentUser.id);

  // Consultation form
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  // Prescription form
  const [prescriptionData, setPrescriptionData] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: '',
    diagnosis: '',
    followUpDate: ''
  });

  // Availability settings
  const [availabilitySettings, setAvailabilitySettings] = useState({
    workingHours: doctorProfile?.availability || 'Mon-Fri: 9AM-5PM',
    videoConsultation: doctorProfile?.consultationType?.includes('Video') || true,
    clinicConsultation: doctorProfile?.consultationType?.includes('Clinic') || true,
    leaveDays: []
  });

  // Get data
  const todayAppointments = getTodayAppointmentsForDoctor(currentUser.id);
  const pendingRequests = getPendingRequestsForDoctor(currentUser.id);
  const upcomingAppointments = getUpcomingAppointmentsForDoctor(currentUser.id);
  const completedAppointments = getCompletedAppointmentsForDoctor(currentUser.id);
  const myPrescriptions = getPrescriptionsByDoctor(currentUser.id);
  const myPatients = getPatientsForDoctor(currentUser.id);
  const notifications = getNotificationsByUser(currentUser.id);
  const unreadCount = getUnreadNotificationsCount(currentUser.id);
  const completedToday = completedAppointments.filter((apt) => apt.date === new Date().toISOString().split('T')[0]).length;
  const completionRate = todayAppointments.length > 0 ? Math.round((completedToday / todayAppointments.length) * 100) : 0;
  const avgConsultationFee = todayAppointments.length > 0
    ? Math.round(todayAppointments.reduce((acc, apt) => acc + Number(apt.consultationFee || doctorProfile?.fee || 0), 0) / todayAppointments.length)
    : Math.round(Number(doctorProfile?.fee || 0));
  const estimatedTodayRevenue = Math.round((completedToday || todayAppointments.length) * Number(doctorProfile?.fee || 0));
  const responseSla = pendingRequests.length === 0 ? 'On Track' : pendingRequests.length <= 2 ? 'Needs Attention' : 'Critical';
  const priorityQueue = [...pendingRequests, ...todayAppointments]
    .filter((apt, idx, arr) => arr.findIndex((x) => x.id === apt.id) === idx)
    .slice(0, 5);
  const dailyCapacityTarget = 8;

  const weeklyCapacityPlan = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const isoDate = date.toISOString().split('T')[0];
    const appointmentsCount = [...todayAppointments, ...upcomingAppointments].filter((apt) => apt.date === isoDate).length;
    const utilization = Math.min(100, Math.round((appointmentsCount / dailyCapacityTarget) * 100));

    return {
      date: isoDate,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      appointmentsCount,
      utilization,
      freeSlots: Math.max(dailyCapacityTarget - appointmentsCount, 0),
    };
  });

  const highRiskPatients = myPatients
    .map((patient) => {
      const age = Number(patient?.profile?.age || 0);
      const conditions = patient?.profile?.conditions?.length || 0;
      const allergies = patient?.profile?.allergies?.length || 0;
      const riskScore = conditions + allergies + (age >= 60 ? 1 : 0);
      return {
        patient,
        riskScore,
      };
    })
    .filter((entry) => entry.riskScore >= 2)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const followUpQueue = completedAppointments
    .filter((apt) => !hasPrescriptionForAppointment(apt.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const symptomIntelligence = [...pendingRequests, ...todayAppointments, ...upcomingAppointments]
    .reduce((acc, appointment) => {
      const primarySymptom = (appointment.symptoms || '')
        .split(/[;,]/)[0]
        .trim()
        .toLowerCase();

      if (!primarySymptom) {
        return acc;
      }

      const key = primarySymptom.length > 22 ? `${primarySymptom.slice(0, 22)}...` : primarySymptom;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const topSymptoms = Object.entries(symptomIntelligence)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const totalPlannedConsults = weeklyCapacityPlan.reduce((sum, slot) => sum + slot.appointmentsCount, 0);
  const avgCapacityUtilization = weeklyCapacityPlan.length > 0
    ? Math.round(weeklyCapacityPlan.reduce((sum, slot) => sum + slot.utilization, 0) / weeklyCapacityPlan.length)
    : 0;
  const consultMixVideoCount = [...todayAppointments, ...upcomingAppointments]
    .filter((apt) => isVideoAppointment(apt)).length;
  const consultMixClinicCount = [...todayAppointments, ...upcomingAppointments].length - consultMixVideoCount;

  const carePrograms = [
    {
      id: 'primary',
      title: 'Primary Consultation',
      description: 'Fast video-first access for common and urgent complaints.',
      metric: `${todayAppointments.length} active today`,
    },
    {
      id: 'second-opinion',
      title: 'Second Opinion Desk',
      description: 'Case review for treatment confirmation and escalation checks.',
      metric: `${pendingRequests.length} requests awaiting triage`,
    },
    {
      id: 'multispecialty',
      title: 'Multispecialty Coordination',
      description: 'Coordinate referral-ready patients with specialists quickly.',
      metric: `${myPatients.length} patients in roster`,
    },
    {
      id: 'followup',
      title: 'Follow-up Continuity',
      description: 'Close loops on diagnosis, prescriptions, and recovery plans.',
      metric: `${followUpQueue.length} follow-ups pending`,
    },
  ];

  const trustSignals = [
    'Board-certified workflow standards',
    'Secure patient records and consultation notes',
    'Structured diagnosis to prescription handoff',
    'Operational queue with SLA awareness',
  ];

  const patientExperienceNotes = [
    {
      title: 'Consultation access',
      note: `${todayAppointments.length > 0 ? 'High' : 'Normal'} appointment activity with ${upcomingAppointments.length} upcoming slots`,
    },
    {
      title: 'Care completion',
      note: `${completionRate}% throughput on today\'s queue`,
    },
    {
      title: 'Follow-up discipline',
      note: `${Math.max(completedAppointments.length - followUpQueue.length, 0)} completed visits with documented outputs`,
    },
  ];

  const filteredPatients = myPatients.filter((patient) => {
    if (!patientSearchQuery.trim()) return true;
    const query = patientSearchQuery.toLowerCase();
    return (
      (patient.name || '').toLowerCase().includes(query) ||
      (patient.email || '').toLowerCase().includes(query) ||
      (patient.phone || '').toLowerCase().includes(query) ||
      (patient.profile?.bloodGroup || '').toLowerCase().includes(query)
    );
  });

  const getPatientRiskCategory = (patient) => {
    const conditionCount = patient?.profile?.conditions?.length || 0;
    const allergyCount = patient?.profile?.allergies?.length || 0;
    if (conditionCount + allergyCount >= 3) return 'High Risk';
    if (conditionCount + allergyCount >= 1) return 'Monitor';
    return 'Stable';
  };
  function hasPrescriptionForAppointment(appointmentId) {
    return myPrescriptions.some((prescription) => prescription.appointmentId === appointmentId);
  }

  function isVideoAppointment(appointment) {
    return (appointment?.type || '').toString().trim().toLowerCase() === 'video';
  }
  const matchesAppointmentFilters = (appointment) => {
    const patient = getUserById(appointment.patientId);
    const query = appointmentSearchQuery.trim().toLowerCase();

    if (appointmentTypeFilter !== 'all' && (appointment.type || '').toLowerCase() !== appointmentTypeFilter) {
      return false;
    }

    if (appointmentStatusFilter !== 'all' && (appointment.status || '').toLowerCase() !== appointmentStatusFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      patient?.name || '',
      patient?.email || '',
      patient?.phone || '',
      appointment?.symptoms || '',
      appointment?.date || '',
      appointment?.time || '',
      appointment?.type || '',
      appointment?.status || '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  };
  const filteredPendingRequests = pendingRequests.filter(matchesAppointmentFilters);
  const filteredTodayAppointments = todayAppointments.filter(matchesAppointmentFilters);
  const filteredUpcomingAppointments = upcomingAppointments.filter(matchesAppointmentFilters);
  const filteredCompletedAppointments = completedAppointments.filter(matchesAppointmentFilters);

  const getSortedVideoAppointments = () => {
    const joinableStatuses = new Set(['confirmed', 'rescheduled', 'pending']);
    return [...todayAppointments, ...upcomingAppointments]
      .filter((apt, idx, arr) => arr.findIndex((x) => x.id === apt.id) === idx)
      .filter((apt) => isVideoAppointment(apt) && joinableStatuses.has((apt.status || '').toLowerCase()))
      .sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
  };
  const nextVideoConsultation = getSortedVideoAppointments()[0] || null;

  const getVisibleAppointments = () => {
    if (activeAppointmentTab === 'pending') return filteredPendingRequests;
    if (activeAppointmentTab === 'today') return filteredTodayAppointments;
    if (activeAppointmentTab === 'upcoming') return filteredUpcomingAppointments;
    return filteredCompletedAppointments;
  };

  const handleExportVisibleAppointments = () => {
    const visibleAppointments = getVisibleAppointments();
    if (visibleAppointments.length === 0) {
      alert('No appointments to export for the current view.');
      return;
    }

    const csvLines = [
      ['Appointment ID', 'Patient Name', 'Patient Phone', 'Patient Email', 'Date', 'Time', 'Type', 'Status', 'Symptoms'].join(','),
      ...visibleAppointments.map((apt) => {
        const patient = getUserById(apt.patientId);
        const row = [
          apt.id,
          patient?.name || '',
          patient?.phone || '',
          patient?.email || '',
          apt.date || '',
          apt.time || '',
          apt.type || '',
          apt.status || '',
          (apt.symptoms || '').replace(/\n/g, ' ').replace(/,/g, ';'),
        ];
        return row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
      }),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doctor-appointments-${activeAppointmentTab}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleContactPatient = (appointment, channel) => {
    const patient = getUserById(appointment.patientId);
    if (channel === 'phone') {
      if (!patient?.phone) {
        alert('Patient phone number is not available.');
        return;
      }
      window.open(`tel:${patient.phone}`, '_self');
      return;
    }

    if (!patient?.email) {
      alert('Patient email is not available.');
      return;
    }

    const subject = encodeURIComponent(`MediConnect Consultation Follow-up (Appointment #${appointment.id})`);
    const body = encodeURIComponent(`Hello ${patient.name || 'Patient'},\n\nThis is regarding your appointment on ${appointment.date} at ${appointment.time}.\n\nRegards,\nDr. ${currentUser.name}`);
    window.open(`mailto:${patient.email}?subject=${subject}&body=${body}`, '_self');
  };
  const formatInr = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

  // Handle accept appointment
  const handleAccept = (appointmentId) => {
    acceptAppointment(appointmentId);
  };

  // Handle reject appointment
  const handleReject = (appointmentId) => {
    const reason = prompt('Reason for rejection (optional):');
    rejectAppointment(appointmentId, reason || '');
  };

  // Start consultation
  const handleStartConsultation = (appointment) => {
    setSelectedAppointment(appointment);
    setConsultationNotes('');
    setDiagnosis('');
    setShowConsultationModal(true);
  };

  const handleJoinVideoCall = async (appointment) => {
    try {
      const meetingLink = await getAppointmentMeetingLink(appointment.id);
      if (!meetingLink) {
        alert('Unable to start the video call. Please try again.');
        return;
      }
      setSelectedAppointment(appointment);
      setVideoCallUrl(meetingLink);
      setShowVideoCallModal(true);
    } catch (error) {
      alert(error.message || 'Unable to start the video call. Please try again.');
    }
  };

  const handleCopyVideoCallLink = async (appointment) => {
    try {
      const meetingLink = await getAppointmentMeetingLink(appointment.id);
      if (!meetingLink) {
        alert('Unable to copy the video call link. Please try again.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(meetingLink);
      } else {
        window.prompt('Copy this video call link', meetingLink);
      }

      setCopiedVideoCallLink(meetingLink);
      window.setTimeout(() => setCopiedVideoCallLink(''), 2000);
    } catch (error) {
      alert(error.message || 'Unable to copy the video call link. Please try again.');
    }
  };

  const handleCloseVideoCall = () => {
    setShowVideoCallModal(false);
    setVideoCallUrl('');
    setCopiedVideoCallLink('');
  };

  // View patient records
  const handleViewPatientRecords = (patientId) => {
    const patient = getUserById(patientId);
    setSelectedPatient(patient);
    setPatientRecordTab('appointments');
    setShowPatientRecordsModal(true);
  };

  // Complete consultation
  const handleCompleteConsultation = async () => {
    if (!diagnosis) {
      alert('Please enter a diagnosis');
      return;
    }

    await completeConsultation(selectedAppointment.id, consultationNotes, diagnosis);

    let suggestedMedicines = [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }];
    try {
      const apiSuggestions = await getPrescriptionSuggestions(selectedAppointment.symptoms);
      if (Array.isArray(apiSuggestions) && apiSuggestions.length > 0) {
        suggestedMedicines = apiSuggestions;
      }
    } catch {
      // Keep fallback row if suggestion API fails.
    }

    setPrescriptionData({
      medicines: suggestedMedicines,
      notes: consultationNotes,
      diagnosis,
      followUpDate: ''
    });

    setShowConsultationModal(false);
    setShowPrescriptionModal(true);
  };

  // Add medicine row
  const addMedicineRow = () => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: [...prescriptionData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  // Remove medicine row
  const removeMedicineRow = (index) => {
    const newMedicines = prescriptionData.medicines.filter((_, i) => i !== index);
    setPrescriptionData({ ...prescriptionData, medicines: newMedicines });
  };

  // Update medicine field
  const updateMedicine = (index, field, value) => {
    const newMedicines = [...prescriptionData.medicines];
    newMedicines[index][field] = value;
    setPrescriptionData({ ...prescriptionData, medicines: newMedicines });
  };

  // Save prescription
  const handleSavePrescription = async () => {
    const validMedicines = prescriptionData.medicines.filter(m => m.name && m.dosage);
    if (validMedicines.length === 0) {
      alert('Please add at least one medicine');
      return;
    }

    try {
      await addPrescription(
        selectedAppointment.id,
        selectedAppointment.patientId,
        currentUser.id,
        validMedicines,
        prescriptionData.notes,
        diagnosis || prescriptionData.diagnosis
      );

      setShowPrescriptionModal(false);
      setPrescriptionData({
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        notes: '',
        diagnosis: '',
        followUpDate: ''
      });
      alert('Prescription saved and sent to patient!');
    } catch (error) {
      alert(error.message || 'Unable to save prescription. Please try again.');
    }
  };

  const handleOpenPrescriptionEditor = (appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosis(appointment?.diagnosis || '');
    setPrescriptionData({
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      notes: appointment?.notes || '',
      diagnosis: appointment?.diagnosis || '',
      followUpDate: ''
    });
    setShowPrescriptionModal(true);
  };

  // Skip prescription
  const handleSkipPrescription = () => {
    setShowPrescriptionModal(false);
    setPrescriptionData({
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      notes: '',
      diagnosis: '',
      followUpDate: ''
    });
  };

  // Save availability
  const handleSaveAvailability = () => {
    const consultationType = [];
    if (availabilitySettings.videoConsultation) consultationType.push('Video');
    if (availabilitySettings.clinicConsultation) consultationType.push('Clinic');

    updateDoctorAvailability(currentUser.id, {
      availability: availabilitySettings.workingHours,
      consultationType
    });
    alert('Availability settings saved!');
  };

  // Get patient data for records modal
  const getPatientAppointments = () => {
    if (!selectedPatient) return [];
    return getPatientHistoryForDoctor(currentUser.id, selectedPatient.id);
  };

  const getPatientPrescriptions = () => {
    if (!selectedPatient) return [];
    return getPrescriptionsByPatient(selectedPatient.id).filter(p => p.doctorId === currentUser.id);
  };

  const getPatientLabReports = () => {
    if (!selectedPatient) return [];
    return getLabReportsByPatient(selectedPatient.id);
  };

  const getPatientHealthRecords = () => {
    if (!selectedPatient) return [];
    return getHealthRecordsByPatient(selectedPatient.id);
  };

  const handleAddLabReportForPatient = async () => {
    if (!selectedPatient) {
      return;
    }

    const name = prompt('Lab test name (e.g., Complete Blood Count)');
    if (!name) return;

    const type = prompt('Test type (e.g., Blood Test, Urine Test, X-Ray)', 'Blood Test');
    if (!type) return;

    const date = prompt('Report date (YYYY-MM-DD)', new Date().toISOString().split('T')[0]);
    if (!date) return;

    const lab = prompt('Lab/Center name', 'MediConnect Lab');
    if (!lab) return;

    const status = prompt('Status (Completed/Pending)', 'Completed') || 'Completed';
    const rawResults = prompt('Results (optional). Format: key:value,key:value', 'hemoglobin:14.2,wbc:7500');

    const results = {};
    if (rawResults && rawResults.trim()) {
      rawResults.split(',').forEach((entry) => {
        const [key, ...valueParts] = entry.split(':');
        const k = (key || '').trim();
        const v = (valueParts.join(':') || '').trim();
        if (k && v) {
          results[k] = v;
        }
      });
    }

    try {
      await addLabReport(selectedPatient.id, {
        name,
        type,
        date,
        doctor: currentUser.name,
        lab,
        status,
        results,
      });
      alert('Lab report added successfully. It is now visible in the patient dashboard.');
    } catch (error) {
      alert(error.message || 'Unable to add lab report. Please try again.');
    }
  };

  return (
    <div className="doctor-dashboard doctor-dashboard-pro">
      {/* Header */}
      <div className="dashboard-header">
        <div className="greeting">
          <h1>{t('Good')} {new Date().getHours() < 12 ? t('Morning') : new Date().getHours() < 17 ? t('Afternoon') : t('Evening')}, Dr. {currentUser.name.split(' ').pop()}</h1>
          <p>{doctorProfile?.specialization} • {doctorProfile?.location}</p>
        </div>
        <div className="header-actions">
          <label className="patient-language-select">
            <span>{t('Choose Language')}</span>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </label>
          <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
            <span className="bell-icon">Alerts</span>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          <div className="user-avatar doctor-avatar">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>{t('Notifications')}</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllNotificationsAsRead(currentUser.id)}>
                {t('Mark all read')}
              </button>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">{t('No notifications')}</div>
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
                    {notification.type === 'message' && '💬'}
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

      {/* Navigation */}
      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleSectionChange('dashboard')}
        >
          {t('Dashboard')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'appointments' ? 'active' : ''}`}
          onClick={() => handleSectionChange('appointments')}
        >
          {t('Appointments')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'patients' ? 'active' : ''}`}
          onClick={() => handleSectionChange('patients')}
        >
          {t('Patients')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'prescriptions' ? 'active' : ''}`}
          onClick={() => handleSectionChange('prescriptions')}
        >
          {t('Prescriptions')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'schedule' ? 'active' : ''}`}
          onClick={() => handleSectionChange('schedule')}
        >
          {t('Schedule')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => handleSectionChange('settings')}
        >
          {t('Settings')}
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">

        <div className="doctor-executive-hero">
          <div className="doctor-executive-left">
            <div className="doctor-executive-badge">Doctor Operations Console</div>
            <h2>Clinical Command Center</h2>
            <p>
              Monitor appointments, prioritize high-risk cases, and close consultations with structured outputs.
            </p>
            <div className="doctor-executive-actions">
              <button className="btn-primary" onClick={() => { handleSectionChange('appointments'); setActiveAppointmentTab('today'); }}>
                Open Today Queue
              </button>
              <button className="btn-secondary" onClick={() => handleSectionChange('patients')}>
                Review Patient Charts
              </button>
            </div>
          </div>
          <div className="doctor-executive-right">
            <div className="doctor-exec-metric">
              <span>Weekly volume</span>
              <strong>{totalPlannedConsults}</strong>
            </div>
            <div className="doctor-exec-metric">
              <span>Avg utilization</span>
              <strong>{avgCapacityUtilization}%</strong>
            </div>
            <div className="doctor-exec-metric">
              <span>Consult mix</span>
              <strong>{consultMixVideoCount} video / {consultMixClinicCount} clinic</strong>
            </div>
          </div>
        </div>

        {/* ==================== DASHBOARD HOME ==================== */}
        {activeSection === 'dashboard' && (
          <div className="section-dashboard">
            {/* Stats Row */}
            <div className="stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-icon stat-icon-text">TD</div>
                <div className="stat-info">
                  <div className="stat-value">{todayAppointments.length}</div>
                  <div className="stat-label">Today's Appointments</div>
                </div>
              </div>
              <div className="stat-card stat-warning">
                <div className="stat-icon stat-icon-text">PQ</div>
                <div className="stat-info">
                  <div className="stat-value">{pendingRequests.length}</div>
                  <div className="stat-label">Pending Requests</div>
                </div>
              </div>
              <div className="stat-card stat-info">
                <div className="stat-icon stat-icon-text">UP</div>
                <div className="stat-info">
                  <div className="stat-value">{upcomingAppointments.length}</div>
                  <div className="stat-label">Upcoming</div>
                </div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-icon stat-icon-text">PT</div>
                <div className="stat-info">
                  <div className="stat-value">{myPatients.length}</div>
                  <div className="stat-label">Total Patients</div>
                </div>
              </div>
            </div>

            <div className="doctor-pro-insights">
              <div className="pro-insight-card">
                <h3>Clinical Throughput</h3>
                <div className="pro-insight-value">{completionRate}%</div>
                <p>{completedToday} completed from today's schedule</p>
              </div>
              <div className="pro-insight-card">
                <h3>Revenue Pulse</h3>
                <div className="pro-insight-value">{formatInr(estimatedTodayRevenue)}</div>
                <p>Avg consult fee {formatInr(avgConsultationFee)}</p>
              </div>
              <div className="pro-insight-card">
                <h3>Response SLA</h3>
                <div className={`pro-insight-value ${responseSla === 'Critical' ? 'danger' : responseSla === 'Needs Attention' ? 'warning' : 'ok'}`}>{responseSla}</div>
                <p>{pendingRequests.length} pending request(s)</p>
              </div>
            </div>

            <div className="doctor-ops-grid">
              <div className="doctor-capacity-panel">
                <div className="doctor-panel-header">
                  <h2>Weekly Capacity Planner</h2>
                  <span>Target: {dailyCapacityTarget} consults/day</span>
                </div>
                <div className="capacity-list">
                  {weeklyCapacityPlan.map((slot) => (
                    <div key={slot.date} className="capacity-row">
                      <div className="capacity-day">{slot.label}</div>
                      <div className="capacity-track">
                        <div className="capacity-fill" style={{ width: `${slot.utilization}%` }} />
                      </div>
                      <div className="capacity-meta">
                        <strong>{slot.appointmentsCount}</strong>
                        <span>{slot.freeSlots} free</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="doctor-risk-panel">
                <div className="doctor-panel-header">
                  <h2>Clinical Risk Watchlist</h2>
                  <span>{highRiskPatients.length} patients flagged</span>
                </div>
                {highRiskPatients.length === 0 ? (
                  <div className="doctor-panel-empty">No high-risk patients right now.</div>
                ) : (
                  <div className="risk-list">
                    {highRiskPatients.map(({ patient, riskScore }) => (
                      <div key={patient.id} className="risk-item">
                        <div>
                          <strong>{patient.name}</strong>
                          <p>{patient.profile?.age || 'N/A'} yrs • {patient.profile?.bloodGroup || 'Blood group N/A'}</p>
                        </div>
                        <div className="risk-actions">
                          <span className="risk-score">Risk {riskScore}</span>
                          <button className="btn-view-record" onClick={() => handleViewPatientRecords(patient.id)}>
                            Open Chart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="doctor-ops-grid secondary">
              <div className="doctor-followup-panel">
                <div className="doctor-panel-header">
                  <h2>Follow-up Tracker</h2>
                  <span>{followUpQueue.length} pending write-ups</span>
                </div>
                {followUpQueue.length === 0 ? (
                  <div className="doctor-panel-empty">All completed visits have prescription notes.</div>
                ) : (
                  <div className="followup-list">
                    {followUpQueue.map((apt) => {
                      const patient = getUserById(apt.patientId);
                      return (
                        <div key={apt.id} className="followup-item">
                          <div>
                            <strong>{patient?.name || 'Patient'}</strong>
                            <p>{apt.date} • {apt.time} • {apt.type}</p>
                          </div>
                          <button className="btn-view-record" onClick={() => handleOpenPrescriptionEditor(apt)}>
                            Write Prescription
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="doctor-symptom-panel">
                <div className="doctor-panel-header">
                  <h2>Symptom Intelligence</h2>
                  <span>From active queue</span>
                </div>
                {topSymptoms.length === 0 ? (
                  <div className="doctor-panel-empty">No symptom data yet for trend analysis.</div>
                ) : (
                  <div className="symptom-chips">
                    {topSymptoms.map(([symptom, count]) => (
                      <div key={symptom} className="symptom-chip">
                        <span>{symptom}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="doctor-service-portfolio">
              <div className="doctor-panel-header">
                <h2>Clinical Service Portfolio</h2>
                <span>Modeled for high-trust telehealth operations</span>
              </div>
              <div className="doctor-service-grid">
                {carePrograms.map((program) => (
                  <article key={program.id} className="doctor-service-card">
                    <h3>{program.title}</h3>
                    <p>{program.description}</p>
                    <span>{program.metric}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="doctor-brand-trust-grid">
              <div className="doctor-trust-panel">
                <div className="doctor-panel-header">
                  <h2>Trust and Compliance Signals</h2>
                  <span>Professional care indicators</span>
                </div>
                <ul className="doctor-trust-list">
                  {trustSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>
              <div className="doctor-experience-panel">
                <div className="doctor-panel-header">
                  <h2>Patient Experience Summary</h2>
                  <span>Live dashboard signals</span>
                </div>
                <div className="doctor-experience-list">
                  {patientExperienceNotes.map((item) => (
                    <div key={item.title} className="doctor-experience-item">
                      <strong>{item.title}</strong>
                      <p>{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="doctor-live-command-center">
              <div className="doctor-live-command-header">
                <h2>Live Consultation Command Center</h2>
                <span>Real-time from your appointment queue</span>
              </div>
              {nextVideoConsultation ? (
                <div className="doctor-live-command-card">
                  <div>
                    <strong>Next video consult</strong>
                    <p>
                      Appointment #{nextVideoConsultation.id} • {nextVideoConsultation.date} • {nextVideoConsultation.time}
                    </p>
                  </div>
                  <div className="doctor-live-command-actions">
                    <button className="btn-start-consult" onClick={() => handleJoinVideoCall(nextVideoConsultation)}>
                      Join Room
                    </button>
                    <button className="btn-view-record" onClick={() => handleCopyVideoCallLink(nextVideoConsultation)}>
                      Copy Invite Link
                    </button>
                    <button className="btn-view-record" onClick={() => handleSectionChange('appointments')}>
                      Open Appointments
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state small">
                  <span className="empty-icon">📹</span>
                  <h3>No upcoming video consultations</h3>
                  <p>Video sessions appear here as soon as appointments are available.</p>
                </div>
              )}
            </div>

            <div className="doctor-priority-queue">
              <div className="priority-header">
                <h2>Priority Consultation Queue</h2>
                <span>Top {priorityQueue.length} items</span>
              </div>
              {priorityQueue.length === 0 ? (
                <div className="empty-state small">
                  <span className="empty-icon">✅</span>
                  <h3>Queue is clear</h3>
                  <p>No pending or immediate consultations</p>
                </div>
              ) : (
                <div className="priority-list">
                  {priorityQueue.map((apt) => {
                    const patient = getUserById(apt.patientId);
                    return (
                      <div key={apt.id} className="priority-item">
                        <div className="priority-main">
                          <strong>{patient?.name}</strong>
                          <p>{apt.date} • {apt.time} • {apt.type}</p>
                        </div>
                        <div className="priority-actions">
                          {apt.status === 'Pending' ? (
                            <button className="btn-accept" onClick={() => handleAccept(apt.id)}>Accept</button>
                          ) : (
                            <button className="btn-start" onClick={() => (isVideoAppointment(apt) ? handleJoinVideoCall(apt) : handleStartConsultation(apt))}>Start</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn" onClick={() => { handleSectionChange('appointments'); setActiveAppointmentTab('pending'); }}>
                  <span className="action-icon">📋</span>
                  <span>View Requests</span>
                </button>
                <button className="action-btn" onClick={() => handleSectionChange('patients')}>
                  <span className="action-icon">👥</span>
                  <span>Patient Records</span>
                </button>
                <button className="action-btn" onClick={() => handleSectionChange('schedule')}>
                  <span className="action-icon">📆</span>
                  <span>Set Availability</span>
                </button>
                <button className="action-btn" onClick={() => handleSectionChange('prescriptions')}>
                  <span className="action-icon">💊</span>
                  <span>Prescriptions</span>
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="today-schedule">
              <h2>📅 Today's Schedule</h2>
              {todayAppointments.length === 0 ? (
                <div className="empty-state small">
                  <span className="empty-icon">😊</span>
                  <h3>No Appointments Today</h3>
                  <p>Enjoy your free day!</p>
                </div>
              ) : (
                <div className="schedule-list">
                  {todayAppointments.map(apt => {
                    const patient = getUserById(apt.patientId);
                    return (
                      <div key={apt.id} className="schedule-item">
                        <div className="schedule-time">
                          <span className="time">{apt.time}</span>
                          <span className={`type-badge ${apt.type.toLowerCase()}`}>
                            {isVideoAppointment(apt) ? '📹' : '🏥'} {apt.type}
                          </span>
                        </div>
                        <div className="schedule-patient">
                          <div className="patient-avatar">{patient?.name.charAt(0)}</div>
                          <div className="patient-info">
                            <h4>{patient?.name}</h4>
                            <p>{patient?.profile?.age} yrs • {patient?.profile?.gender}</p>
                          </div>
                        </div>
                        <div className="schedule-symptoms">
                          <span className="symptom-label">Symptoms:</span>
                          <p>{apt.symptoms}</p>
                        </div>
                        <div className="schedule-actions">
                          <button className="btn-start" onClick={() => (isVideoAppointment(apt) ? handleJoinVideoCall(apt) : handleStartConsultation(apt))}>
                            {isVideoAppointment(apt) ? '📹 Join' : '🩺 Start'}
                          </button>
                          <button className="btn-record" onClick={() => handleViewPatientRecords(apt.patientId)}>
                            📋 Records
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending Requests Preview */}
            {pendingRequests.length > 0 && (
              <div className="pending-preview">
                <h2>⏳ Pending Requests ({pendingRequests.length})</h2>
                <div className="pending-list">
                  {pendingRequests.slice(0, 3).map(apt => {
                    const patient = getUserById(apt.patientId);
                    return (
                      <div key={apt.id} className="pending-card">
                        <div className="pending-info">
                          <div className="patient-avatar small">{patient?.name.charAt(0)}</div>
                          <div>
                            <h4>{patient?.name}</h4>
                            <p>{apt.date} • {apt.time} • {apt.type}</p>
                          </div>
                        </div>
                        <div className="pending-actions">
                          <button className="btn-accept" onClick={() => handleAccept(apt.id)}>✓</button>
                          <button className="btn-reject" onClick={() => handleReject(apt.id)}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pendingRequests.length > 3 && (
                  <button className="view-all-btn" onClick={() => { setActiveSection('appointments'); setActiveAppointmentTab('pending'); }}>
                    View All Requests →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== APPOINTMENTS SECTION ==================== */}
        {activeSection === 'appointments' && (
          <div className="section-appointments">
            <div className="doctor-appointment-toolbar">
              <div className="doctor-appointment-toolbar-left">
                <input
                  type="text"
                  value={appointmentSearchQuery}
                  onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                  className="doctor-appointment-search"
                  placeholder="Search by patient, phone, email, date or symptoms"
                />
                <select
                  value={appointmentTypeFilter}
                  onChange={(e) => setAppointmentTypeFilter(e.target.value)}
                  className="doctor-appointment-filter"
                >
                  <option value="all">All Types</option>
                  <option value="video">Video</option>
                  <option value="clinic">Clinic</option>
                </select>
                <select
                  value={appointmentStatusFilter}
                  onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                  className="doctor-appointment-filter"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button className="btn-view-record" onClick={handleExportVisibleAppointments}>
                ⬇ Export Visible CSV
              </button>
            </div>
            <div className="appointments-tabs">
              <button 
                className={`apt-tab ${activeAppointmentTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveAppointmentTab('pending')}
              >
                <span>⏳</span> Pending <span className="count">{pendingRequests.length}</span>
              </button>
              <button 
                className={`apt-tab ${activeAppointmentTab === 'today' ? 'active' : ''}`}
                onClick={() => setActiveAppointmentTab('today')}
              >
                <span>📅</span> Today <span className="count">{todayAppointments.length}</span>
              </button>
              <button 
                className={`apt-tab ${activeAppointmentTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveAppointmentTab('upcoming')}
              >
                <span>📋</span> Upcoming <span className="count">{upcomingAppointments.length}</span>
              </button>
              <button 
                className={`apt-tab ${activeAppointmentTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveAppointmentTab('completed')}
              >
                <span>✅</span> Completed <span className="count">{completedAppointments.length}</span>
              </button>
            </div>

            {/* Pending Requests Tab */}
            {activeAppointmentTab === 'pending' && (
              <div className="appointments-content">
                {filteredPendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">✅</span>
                    <h3>No Pending Requests</h3>
                    <p>No matching pending appointments for current filters</p>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {filteredPendingRequests.map(apt => {
                      const patient = getUserById(apt.patientId);
                      return (
                        <div key={apt.id} className="doctor-apt-card pending">
                          <div className="apt-patient">
                            <div className="patient-avatar">{patient?.name.charAt(0)}</div>
                            <div className="patient-details">
                              <h4>{patient?.name}</h4>
                              <p>{patient?.profile?.age} yrs • {patient?.profile?.gender} • {patient?.profile?.bloodGroup}</p>
                            </div>
                          </div>
                          <div className="apt-datetime">
                            <div className="date">
                              <span>📅</span> {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="time">
                              <span>⏰</span> {apt.time}
                            </div>
                            <div className={`type ${apt.type.toLowerCase()}`}>
                              {isVideoAppointment(apt) ? '📹' : '🏥'} {apt.type}
                            </div>
                          </div>
                          <div className="apt-symptoms">
                            <strong>Symptoms:</strong>
                            <p>{apt.symptoms}</p>
                          </div>
                          <div className="apt-card-actions">
                            <button className="btn-accept-lg" onClick={() => handleAccept(apt.id)}>
                              <span>✓</span> Accept
                            </button>
                            <button className="btn-reject-lg" onClick={() => handleReject(apt.id)}>
                              <span>✕</span> Decline
                            </button>
                            {isVideoAppointment(apt) && (
                              <button className="btn-view-record" onClick={() => handleJoinVideoCall(apt)}>
                                📹 Open Video Call
                              </button>
                            )}
                            <button className="btn-view-record" onClick={() => handleViewPatientRecords(apt.patientId)}>
                              📋 View Records
                            </button>
                            <button className="btn-view-record" onClick={() => handleContactPatient(apt, 'phone')}>
                              📞 Call
                            </button>
                            <button className="btn-view-record" onClick={() => handleContactPatient(apt, 'email')}>
                              ✉ Email
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Today's Appointments Tab */}
            {activeAppointmentTab === 'today' && (
              <div className="appointments-content">
                {filteredTodayAppointments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">😊</span>
                    <h3>No Appointments Today</h3>
                    <p>No matching appointments for current filters</p>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {filteredTodayAppointments.map(apt => {
                      const patient = getUserById(apt.patientId);
                      return (
                        <div key={apt.id} className="doctor-apt-card today">
                          <div className="apt-patient">
                            <div className="patient-avatar">{patient?.name.charAt(0)}</div>
                            <div className="patient-details">
                              <h4>{patient?.name}</h4>
                              <p>{patient?.profile?.age} yrs • {patient?.profile?.gender}</p>
                            </div>
                          </div>
                          <div className="apt-datetime">
                            <div className="time large">{apt.time}</div>
                            <div className={`type ${apt.type.toLowerCase()}`}>
                              {isVideoAppointment(apt) ? '📹' : '🏥'} {apt.type}
                            </div>
                            <div className={`status status-${apt.status.toLowerCase()}`}>{apt.status}</div>
                          </div>
                          <div className="apt-symptoms">
                            <strong>Symptoms:</strong>
                            <p>{apt.symptoms}</p>
                          </div>
                          <div className="apt-card-actions">
                            <button className="btn-start-consult" onClick={() => (isVideoAppointment(apt) ? handleJoinVideoCall(apt) : handleStartConsultation(apt))}>
                              {isVideoAppointment(apt) ? '📹 Join Video Call' : '🩺 Start Consultation'}
                            </button>
                            {isVideoAppointment(apt) && (
                              <button className="btn-view-record" onClick={() => handleCopyVideoCallLink(apt)}>
                                📋 Copy Link
                              </button>
                            )}
                            {!hasPrescriptionForAppointment(apt.id) && (
                              <button className="btn-view-record" onClick={() => handleOpenPrescriptionEditor(apt)}>
                                💊 Write Prescription
                              </button>
                            )}
                            <button className="btn-view-record" onClick={() => handleViewPatientRecords(apt.patientId)}>
                              📋 Records
                            </button>
                            <button className="btn-view-record" onClick={() => handleContactPatient(apt, 'phone')}>
                              📞 Call
                            </button>
                            <button className="btn-view-record" onClick={() => handleContactPatient(apt, 'email')}>
                              ✉ Email
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Appointments Tab */}
            {activeAppointmentTab === 'upcoming' && (
              <div className="appointments-content">
                {filteredUpcomingAppointments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <h3>No Upcoming Appointments</h3>
                    <p>No matching appointments for current filters</p>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {filteredUpcomingAppointments.map(apt => {
                      const patient = getUserById(apt.patientId);
                      return (
                        <div key={apt.id} className="doctor-apt-card upcoming">
                          <div className="apt-patient">
                            <div className="patient-avatar">{patient?.name.charAt(0)}</div>
                            <div className="patient-details">
                              <h4>{patient?.name}</h4>
                              <p>{patient?.profile?.age} yrs • {patient?.profile?.gender}</p>
                            </div>
                          </div>
                          <div className="apt-datetime">
                            <div className="date">
                              <span>📅</span> {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="time">
                              <span>⏰</span> {apt.time}
                            </div>
                            <div className={`type ${apt.type.toLowerCase()}`}>
                              {isVideoAppointment(apt) ? '📹' : '🏥'} {apt.type}
                            </div>
                          </div>
                          <div className="apt-symptoms">
                            <strong>Symptoms:</strong>
                            <p>{apt.symptoms}</p>
                          </div>
                          <div className="apt-card-actions">
                            {isVideoAppointment(apt) && (
                              <button className="btn-start-consult" onClick={() => handleJoinVideoCall(apt)}>
                                📹 Open Video Call
                              </button>
                            )}
                            {!hasPrescriptionForAppointment(apt.id) && (
                              <button className="btn-view-record" onClick={() => handleOpenPrescriptionEditor(apt)}>
                                💊 Write Prescription
                              </button>
                            )}
                            <button className="btn-view-record" onClick={() => handleViewPatientRecords(apt.patientId)}>
                              📋 View Patient Records
                            </button>
                            <button className="btn-view-record" onClick={() => handleContactPatient(apt, 'phone')}>
                              📞 Call
                            </button>
                            <button className="btn-view-record" onClick={() => handleContactPatient(apt, 'email')}>
                              ✉ Email
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Completed Appointments Tab */}
            {activeAppointmentTab === 'completed' && (
              <div className="appointments-content">
                {filteredCompletedAppointments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📋</span>
                    <h3>No Completed Appointments</h3>
                    <p>No matching appointments for current filters</p>
                  </div>
                ) : (
                  <div className="appointment-list">
                    {filteredCompletedAppointments.slice(0, 10).map(apt => {
                      const patient = getUserById(apt.patientId);
                      return (
                        <div key={apt.id} className="doctor-apt-card completed">
                          <div className="apt-patient">
                            <div className="patient-avatar">{patient?.name.charAt(0)}</div>
                            <div className="patient-details">
                              <h4>{patient?.name}</h4>
                              <p>{patient?.profile?.age} yrs • {patient?.profile?.gender}</p>
                            </div>
                          </div>
                          <div className="apt-datetime">
                            <div className="date">
                              <span>📅</span> {apt.date}
                            </div>
                            {apt.diagnosis && (
                              <div className="diagnosis">
                                <span>🩺</span> {apt.diagnosis}
                              </div>
                            )}
                          </div>
                          <div className="apt-card-actions">
                            {!hasPrescriptionForAppointment(apt.id) && (
                              <button className="btn-view-record" onClick={() => handleOpenPrescriptionEditor(apt)}>
                                💊 Write Prescription
                              </button>
                            )}
                            <button className="btn-view-record" onClick={() => handleViewPatientRecords(apt.patientId)}>
                              📋 View Records
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== PATIENTS SECTION ==================== */}
        {activeSection === 'patients' && (
          <div className="section-patients">
            <div className="doctor-patient-toolbar">
              <h2>👥 My Patients ({filteredPatients.length})</h2>
              <input
                type="text"
                className="doctor-patient-search"
                placeholder="Search by name, email, phone or blood group"
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
              />
            </div>
            {filteredPatients.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <h3>No matching patients</h3>
                <p>Try a different search keyword</p>
              </div>
            ) : (
              <div className="patients-grid">
                {filteredPatients.map(patient => {
                  const patientAppointments = getPatientHistoryForDoctor(currentUser.id, patient.id);
                  const lastVisit = patientAppointments[0];
                  const riskCategory = getPatientRiskCategory(patient);
                  return (
                    <div key={patient.id} className="patient-card" onClick={() => handleViewPatientRecords(patient.id)}>
                      <div className="patient-card-header">
                        <div className="patient-avatar large">{patient.name.charAt(0)}</div>
                        <div className="patient-info">
                          <h3>{patient.name}</h3>
                          <p>{patient.profile?.age} yrs • {patient.profile?.gender}</p>
                        </div>
                        <span className={`patient-risk-badge ${riskCategory === 'High Risk' ? 'high' : riskCategory === 'Monitor' ? 'monitor' : 'stable'}`}>
                          {riskCategory}
                        </span>
                      </div>
                      <div className="patient-card-body">
                        <div className="info-row">
                          <span className="label">Blood Group:</span>
                          <span className="value">{patient.profile?.bloodGroup || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Total Visits:</span>
                          <span className="value">{patientAppointments.length}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Last Visit:</span>
                          <span className="value">{lastVisit?.date || 'N/A'}</span>
                        </div>
                        {patient.profile?.allergies?.length > 0 && (
                          <div className="allergies">
                            <span className="label">⚠️ Allergies:</span>
                            <div className="allergy-tags">
                              {patient.profile.allergies.map((a, i) => (
                                <span key={i} className="allergy-tag">{a}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="patient-card-footer">
                        <button className="btn-view-full">View Full Records →</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== PRESCRIPTIONS SECTION ==================== */}
        {activeSection === 'prescriptions' && (
          <div className="section-prescriptions">
            <h2>💊 My Prescriptions ({myPrescriptions.length})</h2>
            {myPrescriptions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💊</span>
                <h3>No Prescriptions Yet</h3>
                <p>Prescriptions you create will appear here</p>
              </div>
            ) : (
              <div className="prescriptions-list">
                {myPrescriptions.map(pres => {
                  const patient = getUserById(pres.patientId);
                  return (
                    <div key={pres.id} className="doctor-pres-card">
                      <div className="pres-header">
                        <div className="pres-patient">
                          <div className="patient-avatar small">{patient?.name.charAt(0)}</div>
                          <div>
                            <h4>{patient?.name}</h4>
                            <p>Prescription #{pres.id}</p>
                          </div>
                        </div>
                        <div className="pres-meta">
                          <span className="pres-date">📅 {new Date(pres.createdAt).toLocaleDateString()}</span>
                          <span className={`pres-status status-${pres.status.toLowerCase()}`}>{pres.status}</span>
                        </div>
                      </div>
                      {pres.diagnosis && (
                        <div className="pres-diagnosis">
                          <span>🩺 Diagnosis:</span> {pres.diagnosis}
                        </div>
                      )}
                      <div className="pres-medicines">
                        <h5>Medicines:</h5>
                        <ul>
                          {pres.medicines.map((med, idx) => (
                            <li key={idx}>
                              <span className="med-name">💊 {med.name}</span>
                              <span className="med-info">{med.dosage} • {med.frequency} • {med.duration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {pres.notes && (
                        <div className="pres-notes">
                          <span>📝 Notes:</span> {pres.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== SCHEDULE / AVAILABILITY SECTION ==================== */}
        {activeSection === 'schedule' && (
          <div className="section-schedule">
            <h2>📆 Manage Availability</h2>
            <div className="schedule-grid">
              <div className="schedule-card">
                <h3>Working Hours</h3>
                <div className="form-group">
                  <label>Set your working hours</label>
                  <input
                    type="text"
                    value={availabilitySettings.workingHours}
                    onChange={(e) => setAvailabilitySettings({...availabilitySettings, workingHours: e.target.value})}
                    placeholder="e.g., Mon-Fri: 9AM-5PM"
                  />
                </div>
              </div>

              <div className="schedule-card">
                <h3>Consultation Types</h3>
                <div className="toggle-group">
                  <label className="toggle-item">
                    <input
                      type="checkbox"
                      checked={availabilitySettings.videoConsultation}
                      onChange={(e) => setAvailabilitySettings({...availabilitySettings, videoConsultation: e.target.checked})}
                    />
                    <span className="toggle-label">📹 Video Consultation</span>
                    <span className={`toggle-status ${availabilitySettings.videoConsultation ? 'enabled' : 'disabled'}`}>
                      {availabilitySettings.videoConsultation ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                  <label className="toggle-item">
                    <input
                      type="checkbox"
                      checked={availabilitySettings.clinicConsultation}
                      onChange={(e) => setAvailabilitySettings({...availabilitySettings, clinicConsultation: e.target.checked})}
                    />
                    <span className="toggle-label">🏥 Clinic Visit</span>
                    <span className={`toggle-status ${availabilitySettings.clinicConsultation ? 'enabled' : 'disabled'}`}>
                      {availabilitySettings.clinicConsultation ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="schedule-card full-width">
                <h3>Current Profile Info</h3>
                <div className="profile-info-grid">
                  <div className="info-item">
                    <span className="label">Specialization:</span>
                    <span className="value">{doctorProfile?.specialization}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Experience:</span>
                    <span className="value">{doctorProfile?.experience}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Location:</span>
                    <span className="value">{doctorProfile?.location}, {doctorProfile?.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Consultation Fee:</span>
                    <span className="value">{formatInr(doctorProfile?.fee)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Rating:</span>
                    <span className="value">⭐ {doctorProfile?.rating} ({doctorProfile?.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="btn-save-availability" onClick={handleSaveAvailability}>
              💾 Save Availability Settings
            </button>
          </div>
        )}

        {/* ==================== SETTINGS SECTION ==================== */}
        {activeSection === 'settings' && (
          <div className="section-settings">
            <h2>⚙️ Account Settings</h2>
            <div className="settings-grid">
              <div className="settings-card">
                <h3>Profile Information</h3>
                <div className="settings-info">
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{currentUser.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{currentUser.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{currentUser.phone || 'Not set'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Role:</span>
                    <span className="value">{currentUser.role}</span>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h3>Professional Details</h3>
                <div className="settings-info">
                  <div className="info-row">
                    <span className="label">Specialization:</span>
                    <span className="value">{doctorProfile?.specialization}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Education:</span>
                    <span className="value">{doctorProfile?.education}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Languages:</span>
                    <span className="value">{doctorProfile?.languages?.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== CONSULTATION MODAL ==================== */}
      {showConsultationModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowConsultationModal(false)}>
          <div className="modal consultation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowConsultationModal(false)}>×</button>
            
            <div className="consultation-header">
              <h2>🩺 Consultation</h2>
              <p>Patient: {getUserById(selectedAppointment.patientId)?.name}</p>
            </div>

            <div className="consultation-body">
              {/* Patient Info Panel */}
              <div className="patient-panel">
                <h3>Patient Details</h3>
                {(() => {
                  const patient = getUserById(selectedAppointment.patientId);
                  return (
                    <div className="patient-details-grid">
                      <div className="detail">
                        <span className="label">Age:</span>
                        <span>{patient?.profile?.age} yrs</span>
                      </div>
                      <div className="detail">
                        <span className="label">Gender:</span>
                        <span>{patient?.profile?.gender}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Blood Group:</span>
                        <span>{patient?.profile?.bloodGroup}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Allergies:</span>
                        <span>{patient?.profile?.allergies?.join(', ') || 'None'}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Conditions:</span>
                        <span>{patient?.profile?.conditions?.join(', ') || 'None'}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="symptoms-section">
                  <h4>Presented Symptoms</h4>
                  <p>{selectedAppointment.symptoms}</p>
                </div>

                {isVideoAppointment(selectedAppointment) && (
                  <div className="video-section">
                    <button className="btn-video-call" onClick={() => handleJoinVideoCall(selectedAppointment)}>
                      📹 Join Video Call
                    </button>
                    <p className="video-hint">Video consultation will open in a new window</p>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="notes-panel">
                <h3>Consultation Notes</h3>
                <textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Enter consultation notes..."
                  rows="5"
                />

                <h3>Diagnosis</h3>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                />

                <div className="file-upload">
                  <h4>Attach Files (optional)</h4>
                  <div className="upload-area">
                    <span>📎</span>
                    <p>Drop files here or click to upload</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="consultation-footer">
              <button className="btn-cancel" onClick={() => setShowConsultationModal(false)}>
                Cancel
              </button>
              <button className="btn-complete" onClick={handleCompleteConsultation}>
                Complete & Add Prescription →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRESCRIPTION MODAL ==================== */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => handleSkipPrescription()}>
          <div className="modal prescription-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => handleSkipPrescription()}>×</button>
            
            <div className="prescription-header">
              <h2>💊 Create Prescription</h2>
              <p>For: {getUserById(selectedAppointment.patientId)?.name}</p>
              {diagnosis && <p className="diagnosis-label">Diagnosis: {diagnosis}</p>}
            </div>

            <div className="prescription-body">
              <div className="medicines-section">
                <h3>Medicines</h3>
                {prescriptionData.medicines.map((med, index) => (
                  <div key={index} className="medicine-row">
                    <div className="medicine-inputs">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={med.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g., Twice daily)"
                        value={med.frequency}
                        onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 7 days)"
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Instructions"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                      />
                    </div>
                    {prescriptionData.medicines.length > 1 && (
                      <button className="btn-remove-med" onClick={() => removeMedicineRow(index)}>✕</button>
                    )}
                  </div>
                ))}
                <button className="btn-add-medicine" onClick={addMedicineRow}>
                  + Add Another Medicine
                </button>
              </div>

              <div className="prescription-notes">
                <h3>Additional Notes</h3>
                <textarea
                  value={prescriptionData.notes}
                  onChange={(e) => setPrescriptionData({...prescriptionData, notes: e.target.value})}
                  placeholder="Any special instructions for the patient..."
                  rows="3"
                />
              </div>

              <div className="follow-up-section">
                <h3>Follow-up Date (optional)</h3>
                <input
                  type="date"
                  value={prescriptionData.followUpDate}
                  onChange={(e) => setPrescriptionData({...prescriptionData, followUpDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="prescription-footer">
              <button className="btn-skip" onClick={handleSkipPrescription}>
                Skip Prescription
              </button>
              <button className="btn-save-pres" onClick={handleSavePrescription}>
                💾 Save & Send Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PATIENT RECORDS MODAL ==================== */}
      {showPatientRecordsModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowPatientRecordsModal(false)}>
          <div className="modal patient-records-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPatientRecordsModal(false)}>×</button>
            
            <div className="records-header">
              <div className="patient-banner">
                <div className="patient-avatar large">{selectedPatient.name.charAt(0)}</div>
                <div className="patient-info">
                  <h2>{selectedPatient.name}</h2>
                  <p>{selectedPatient.profile?.age} yrs • {selectedPatient.profile?.gender} • {selectedPatient.profile?.bloodGroup}</p>
                </div>
              </div>
              {selectedPatient.profile?.allergies?.length > 0 && (
                <div className="allergies-warning">
                  ⚠️ Allergies: {selectedPatient.profile.allergies.join(', ')}
                </div>
              )}
            </div>

            <div className="records-tabs">
              <button 
                className={`record-tab ${patientRecordTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setPatientRecordTab('appointments')}
              >
                Past Appointments
              </button>
              <button 
                className={`record-tab ${patientRecordTab === 'prescriptions' ? 'active' : ''}`}
                onClick={() => setPatientRecordTab('prescriptions')}
              >
                Prescriptions
              </button>
              <button 
                className={`record-tab ${patientRecordTab === 'labReports' ? 'active' : ''}`}
                onClick={() => setPatientRecordTab('labReports')}
              >
                Lab Reports
              </button>
              <button 
                className={`record-tab ${patientRecordTab === 'history' ? 'active' : ''}`}
                onClick={() => setPatientRecordTab('history')}
              >
                Medical History
              </button>
            </div>

            <div className="records-content">
              {patientRecordTab === 'appointments' && (
                <div className="records-list">
                  {getPatientAppointments().length === 0 ? (
                    <div className="empty-records">No appointment history with this patient</div>
                  ) : (
                    getPatientAppointments().map(apt => (
                      <div key={apt.id} className="record-item">
                        <div className="record-date">{apt.date}</div>
                        <div className="record-details">
                          <strong>Symptoms:</strong> {apt.symptoms}
                          {apt.diagnosis && <><br/><strong>Diagnosis:</strong> {apt.diagnosis}</>}
                          {apt.notes && <><br/><strong>Notes:</strong> {apt.notes}</>}
                        </div>
                        <div className={`record-status status-${apt.status.toLowerCase()}`}>{apt.status}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {patientRecordTab === 'prescriptions' && (
                <div className="records-list">
                  {getPatientPrescriptions().length === 0 ? (
                    <div className="empty-records">No prescriptions for this patient</div>
                  ) : (
                    getPatientPrescriptions().map(pres => (
                      <div key={pres.id} className="record-item prescription">
                        <div className="record-date">{new Date(pres.createdAt).toLocaleDateString()}</div>
                        <div className="record-details">
                          {pres.diagnosis && <><strong>Diagnosis:</strong> {pres.diagnosis}<br/></>}
                          <strong>Medicines:</strong>
                          <ul>
                            {pres.medicines.map((m, i) => (
                              <li key={i}>{m.name} - {m.dosage} ({m.frequency})</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {patientRecordTab === 'labReports' && (
                <div className="records-list">
                  <div style={{ marginBottom: '12px' }}>
                    <button className="btn-view-report" onClick={handleAddLabReportForPatient}>
                      + Add Lab Report
                    </button>
                  </div>
                  {getPatientLabReports().length === 0 ? (
                    <div className="empty-records">No lab reports available</div>
                  ) : (
                    getPatientLabReports().map(report => (
                      <div key={report.id} className="record-item lab">
                        <div className="record-date">{report.date}</div>
                        <div className="record-details">
                          <strong>{report.name}</strong> - {report.type}
                          <br/><span className="lab-info">Lab: {report.lab}</span>
                        </div>
                        <button className="btn-view-report">View Results</button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {patientRecordTab === 'history' && (
                <div className="records-list">
                  <div className="health-summary">
                    <div className="summary-item">
                      <strong>Conditions:</strong>
                      <span>{selectedPatient.profile?.conditions?.join(', ') || 'None reported'}</span>
                    </div>
                    <div className="summary-item">
                      <strong>Allergies:</strong>
                      <span>{selectedPatient.profile?.allergies?.join(', ') || 'None reported'}</span>
                    </div>
                  </div>
                  {getPatientHealthRecords().length === 0 ? (
                    <div className="empty-records">No medical history records</div>
                  ) : (
                    getPatientHealthRecords().map(record => (
                      <div key={record.id} className="record-item history">
                        <div className="record-date">{record.date}</div>
                        <div className="record-details">
                          <span className={`record-type type-${record.type.toLowerCase()}`}>{record.type}</span>
                          <strong>{record.title}</strong>
                          <p>{record.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
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
                <h3 style={{ margin: 0 }}>Video Consultation</h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>
                  {selectedAppointment ? `Appointment #${selectedAppointment.id}` : 'Live call session'}
                </p>
                <p style={{ margin: '4px 0 0', color: '#1d4ed8', fontSize: '12px' }}>
                  Meeting link is auto-generated by the system for this appointment.
                </p>
                {copiedVideoCallLink === videoCallUrl && (
                  <p style={{ margin: '4px 0 0', color: '#059669', fontSize: '12px' }}>
                    Link copied for the patient.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-view-record"
                  onClick={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(videoCallUrl).then(() => setCopiedVideoCallLink(videoCallUrl)).catch(() => window.prompt('Copy this video call link', videoCallUrl));
                    } else {
                      window.prompt('Copy this video call link', videoCallUrl);
                    }
                  }}
                >
                  Copy Link
                </button>
                <button className="btn-view-record" onClick={() => window.open(videoCallUrl, '_blank', 'noopener,noreferrer')}>
                  Open in New Tab
                </button>
                <button className="btn-reject" onClick={handleCloseVideoCall}>End Call</button>
              </div>
            </div>
            <div className="doctor-dashboard-video-call-info">
              <div>
                <strong>Patient joins the same room.</strong>
                <p>Share the link after accepting the appointment, then keep this room open for the consultation.</p>
              </div>
            </div>
            <iframe
              title="Doctor Video Consultation"
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

export default DoctorDashboard;
