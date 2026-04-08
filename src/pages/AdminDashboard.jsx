import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentUser,
    users,
    doctors,
    appointments,
    prescriptions,
    medicineOrders,
    systemSettings,
    doctorVerifications,
    getAdminStats,
    getDailyAppointmentCounts,
    getPopularSpecializations,
    verifyDoctor,
    toggleUserBlock,
    updateSystemSettings,
    getDoctorVerificationStatus,
    getAllOrders,
    getUserById,
    getDoctorById,
    getNotificationsByUser,
    getUnreadNotificationsCount,
    markAllNotificationsAsRead,
  } = useAppContext();
  const { selectedLanguage, setSelectedLanguage, languageOptions, t } = useLanguage();

  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'dashboard');
  const [activeUserTab, setActiveUserTab] = useState('patients');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempSettings, setTempSettings] = useState({ ...systemSettings });

  // Sync with URL
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  // Get data
  const stats = getAdminStats();
  const dailyAppointments = getDailyAppointmentCounts(7);
  const popularSpecs = getPopularSpecializations();
  const allOrders = getAllOrders();
  const notifications = getNotificationsByUser(currentUser.id);
  const unreadCount = getUnreadNotificationsCount(currentUser.id);

  // Filter users by role
  const patientUsers = users.filter(u => u.role === 'Patient');
  const doctorUsers = users.filter(u => u.role === 'Doctor');
  const pharmacistUsers = users.filter(u => u.role === 'Pharmacist');

  // Filter users by search
  const filterUsers = (userList) => {
    if (!searchQuery) return userList;
    return userList.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Pending doctor verifications
  const pendingDoctors = doctors.filter(d => {
    const verification = getDoctorVerificationStatus(d.id);
    return verification.status !== 'Verified';
  });

  const blockedUsersCount = users.filter((u) => u.isBlocked).length;
  const activeUsersCount = users.length - blockedUsersCount;
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter((apt) => apt.date > today && !['Cancelled', 'Rejected'].includes(apt.status)).length;
  const pendingAppointments = appointments.filter((apt) => apt.status === 'Pending').length;
  const confirmedAppointments = appointments.filter((apt) => ['Confirmed', 'Accepted'].includes(apt.status)).length;
  const inPersonAppointments = appointments.filter((apt) => (apt.type || '').toLowerCase() === 'in-person').length;
  const videoAppointments = appointments.filter((apt) => (apt.type || '').toLowerCase() === 'video').length;

  const deliveredOrders = medicineOrders.filter((o) => o.status === 'Delivered');
  const processingOrders = medicineOrders.filter((o) => ['Processing', 'Preparing'].includes(o.status));
  const paymentCapturedAppointments = appointments.filter((apt) => apt.paymentStatus === 'PAID').length;
  const paymentPendingAppointments = appointments.filter((apt) => apt.paymentStatus !== 'PAID').length;

  const totalConsultationRevenue = appointments
    .filter((apt) => apt.paymentStatus === 'PAID')
    .reduce((sum, apt) => sum + Number(apt.consultationFee || 0), 0);
  const medicineRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const platformRevenue = totalConsultationRevenue + medicineRevenue;

  const completionRate = stats.totalAppointments
    ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
    : 0;
  const verificationRate = stats.totalDoctors
    ? Math.round(((stats.totalDoctors - pendingDoctors.length) / stats.totalDoctors) * 100)
    : 100;
  const paymentSuccessRate = appointments.length
    ? Math.round((paymentCapturedAppointments / appointments.length) * 100)
    : 0;

  const systemHealthScore = Math.round(
    (completionRate * 0.35) +
    (verificationRate * 0.25) +
    ((100 - Number(stats.cancellationRate || 0)) * 0.2) +
    (paymentSuccessRate * 0.2)
  );

  const topDoctorsByLoad = doctors
    .map((doctor) => {
      const doctorAppointments = appointments.filter((apt) => apt.doctorId === doctor.id);
      const doctorCompleted = doctorAppointments.filter((apt) => apt.status === 'Completed').length;
      const doctorPending = doctorAppointments.filter((apt) => apt.status === 'Pending').length;
      return {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        total: doctorAppointments.length,
        completed: doctorCompleted,
        pending: doctorPending,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(`${b.date} ${b.time || '00:00'}`) - new Date(`${a.date} ${a.time || '00:00'}`))
    .slice(0, 6);

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt || b.orderDate || 0) - new Date(a.createdAt || a.orderDate || 0))
    .slice(0, 6);

  const systemAlerts = [
    pendingDoctors.length > 0
      ? { level: 'warning', title: 'Doctor verifications pending', value: `${pendingDoctors.length} profiles require review` }
      : null,
    processingOrders.length > 0
      ? { level: 'info', title: 'Orders in fulfillment queue', value: `${processingOrders.length} medicine orders in processing` }
      : null,
    Number(stats.cancellationRate) > 15
      ? { level: 'danger', title: 'Cancellation risk elevated', value: `${stats.cancellationRate}% appointment cancellation rate` }
      : null,
    blockedUsersCount > 0
      ? { level: 'warning', title: 'Blocked users detected', value: `${blockedUsersCount} blocked account(s) across roles` }
      : null,
  ].filter(Boolean);

  // Handle verify doctor
  const handleVerifyDoctor = (doctorId) => {
    verifyDoctor(doctorId);
  };

  // Handle block/unblock user
  const handleToggleBlock = (userId) => {
    toggleUserBlock(userId);
  };

  // Save settings
  const handleSaveSettings = () => {
    updateSystemSettings(tempSettings);
    setShowSettingsModal(false);
  };

  // Calculate max for chart
  const maxAppointments = Math.max(...dailyAppointments.map(d => d.count), 1);
  const formatInr = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="greeting">
          <h1>{t('System Command Center')}</h1>
          <p>Welcome back, {currentUser.name}. See platform health, operations, finance, and risk in one place.</p>
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
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          <button className="btn-sm btn-secondary" onClick={() => setShowSettingsModal(true)}>
            System Settings
          </button>
          <div className="user-avatar admin-avatar">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="admin-notifications-panel">
          <div className="admin-notifications-header">
            <h3>Notifications</h3>
            <button className="btn-sm btn-secondary" onClick={() => markAllNotificationsAsRead(currentUser.id)}>
              Mark all read
            </button>
          </div>
          <div className="admin-notifications-list">
            {notifications.slice(0, 5).map((note) => (
              <div key={note.id} className={`admin-notification-item ${note.isRead ? '' : 'unread'}`}>
                <p className="note-title">{note.title}</p>
                <p className="note-message">{note.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="admin-empty-note">No notifications right now.</p>
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
          <span>🏠</span> {t('Dashboard')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => handleSectionChange('users')}
        >
          <span>👥</span> {t('Users')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'doctors' ? 'active' : ''}`}
          onClick={() => handleSectionChange('doctors')}
        >
          <span>👨‍⚕️</span> {t('Doctor Verification')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'appointments' ? 'active' : ''}`}
          onClick={() => handleSectionChange('appointments')}
        >
          <span>📅</span> {t('Appointments')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'reports' ? 'active' : ''}`}
          onClick={() => handleSectionChange('reports')}
        >
          <span>📊</span> {t('Reports')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => handleSectionChange('settings')}
        >
          <span>⚙️</span> {t('Settings')}
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">

        {/* ==================== DASHBOARD OVERVIEW ==================== */}
        {activeSection === 'dashboard' && (
          <div className="section-dashboard">
            <div className="admin-command-hero">
              <div className="command-hero-main">
                <span className="hero-eyebrow">Platform Intelligence</span>
                <h2>Unified visibility across care delivery, users, verification, and payments</h2>
                <p>
                  This live cockpit gives operations, finance, compliance, and service quality signals so admin teams can react quickly.
                </p>
                <div className="hero-tags">
                  <span>Active Users: {activeUsersCount}</span>
                  <span>Upcoming Appointments: {upcomingAppointments}</span>
                  <span>Open Orders: {processingOrders.length}</span>
                </div>
              </div>
              <div className="command-hero-score">
                <div className="score-ring" style={{ '--score': `${systemHealthScore}%` }}>
                  <strong>{systemHealthScore}%</strong>
                  <span>System Health</span>
                </div>
                <ul>
                  <li>Completion Rate: {completionRate}%</li>
                  <li>Verification Rate: {verificationRate}%</li>
                  <li>Payment Success: {paymentSuccessRate}%</li>
                </ul>
              </div>
            </div>

            {/* Executive KPI Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper blue">
                  <span>Users</span>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{users.length}</div>
                  <div className="stat-label">Total Accounts</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper green">
                  <span>Care</span>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{stats.totalAppointments}</div>
                  <div className="stat-label">Total Appointments</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper teal">
                  <span>Revenue</span>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{formatInr(platformRevenue)}</div>
                  <div className="stat-label">Platform Revenue</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper orange">
                  <span>Today</span>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{stats.todayAppointments}</div>
                  <div className="stat-label">Today's Consultations</div>
                </div>
              </div>
              <div className="admin-stat-card warning">
                <div className="stat-icon-wrapper yellow">
                  <span>Risk</span>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{systemAlerts.length}</div>
                  <div className="stat-label">Active Alerts</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper purple">
                  <span>Access</span>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{blockedUsersCount}</div>
                  <div className="stat-label">Blocked Accounts</div>
                </div>
              </div>
            </div>

            <div className="admin-insight-grid">
              <div className="insight-card">
                <div className="insight-head">
                  <h3>System Risk Watchlist</h3>
                  <span>{systemAlerts.length} alerts</span>
                </div>
                {systemAlerts.length === 0 && <p className="empty-chart">No high-priority risk signals. Platform is stable.</p>}
                <div className="alert-list">
                  {systemAlerts.map((alert, idx) => (
                    <div key={idx} className={`alert-item ${alert.level}`}>
                      <div>
                        <strong>{alert.title}</strong>
                        <p>{alert.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-head">
                  <h3>Revenue and Payments</h3>
                  <span>Live settlement pulse</span>
                </div>
                <div className="finance-grid">
                  <div>
                    <p>Consultation Revenue</p>
                    <strong>{formatInr(totalConsultationRevenue)}</strong>
                  </div>
                  <div>
                    <p>Medicine Revenue</p>
                    <strong>{formatInr(medicineRevenue)}</strong>
                  </div>
                  <div>
                    <p>Paid Appointments</p>
                    <strong>{paymentCapturedAppointments}</strong>
                  </div>
                  <div>
                    <p>Pending Payments</p>
                    <strong>{paymentPendingAppointments}</strong>
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-head">
                  <h3>Operational Queues</h3>
                  <span>Actionable workloads</span>
                </div>
                <div className="queue-list">
                  <div className="queue-row"><span>Pending Appointments</span><strong>{pendingAppointments}</strong></div>
                  <div className="queue-row"><span>Confirmed/Accepted</span><strong>{confirmedAppointments}</strong></div>
                  <div className="queue-row"><span>Pending Doctor Verification</span><strong>{pendingDoctors.length}</strong></div>
                  <div className="queue-row"><span>Orders in Processing</span><strong>{processingOrders.length}</strong></div>
                  <div className="queue-row"><span>Delivered Orders</span><strong>{deliveredOrders.length}</strong></div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
              {/* Appointments Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Appointment Demand (Last 7 Days)</h3>
                </div>
                <div className="chart-content">
                  <div className="bar-chart">
                    {dailyAppointments.map((day, idx) => (
                      <div key={idx} className="bar-item">
                        <div className="bar-wrapper">
                          <div 
                            className="bar" 
                            style={{ height: `${(day.count / maxAppointments) * 100}%` }}
                          >
                            <span className="bar-value">{day.count}</span>
                          </div>
                        </div>
                        <div className="bar-label">{day.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular Specializations */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Top Specializations</h3>
                </div>
                <div className="chart-content">
                  <div className="specialization-list">
                    {popularSpecs.slice(0, 5).map((spec, idx) => (
                      <div key={idx} className="spec-item">
                        <div className="spec-info">
                          <span className="spec-rank">#{idx + 1}</span>
                          <span className="spec-name">{spec.name}</span>
                        </div>
                        <div className="spec-bar-wrapper">
                          <div 
                            className="spec-bar" 
                            style={{ width: `${(spec.count / (popularSpecs[0]?.count || 1)) * 100}%` }}
                          ></div>
                          <span className="spec-count">{spec.count} appointments</span>
                        </div>
                      </div>
                    ))}
                    {popularSpecs.length === 0 && (
                      <div className="empty-chart">No appointment data yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-insight-grid lower">
              <div className="insight-card">
                <div className="insight-head">
                  <h3>Top Doctor Workload</h3>
                  <span>Capacity distribution</span>
                </div>
                <div className="leader-list">
                  {topDoctorsByLoad.map((doc) => (
                    <div key={doc.id} className="leader-item">
                      <div>
                        <strong>{doc.name}</strong>
                        <p>{doc.specialization}</p>
                      </div>
                      <div className="leader-meta">
                        <span>{doc.total} consults</span>
                        <span>{doc.pending} pending</span>
                      </div>
                    </div>
                  ))}
                  {topDoctorsByLoad.length === 0 && <p className="empty-chart">No doctor workload data available.</p>}
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-head">
                  <h3>Recent Appointment Activity</h3>
                  <span>Most recent 6 records</span>
                </div>
                <div className="activity-list">
                  {recentAppointments.map((apt) => {
                    const patient = getUserById(apt.patientId);
                    const doctor = getDoctorById(apt.doctorId);
                    return (
                      <div key={apt.id} className="activity-item">
                        <div>
                          <strong>{patient?.name || 'Unknown'} with {doctor?.name || 'Unknown'}</strong>
                          <p>{apt.date} at {apt.time} | {apt.type || 'Consultation'}</p>
                        </div>
                        <span className="badge badge-info">{apt.status}</span>
                      </div>
                    );
                  })}
                  {recentAppointments.length === 0 && <p className="empty-chart">No appointments yet.</p>}
                </div>
              </div>

              <div className="insight-card">
                <div className="insight-head">
                  <h3>Recent Medicine Orders</h3>
                  <span>Latest order pipeline</span>
                </div>
                <div className="activity-list">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="activity-item">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <p>{order.patient?.name || 'Unknown patient'} | {formatInr(order.totalAmount)}</p>
                      </div>
                      <span className={`badge badge-${order.status === 'Delivered' ? 'success' : order.status === 'Dispatched' ? 'info' : 'warning'}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                  {recentOrders.length === 0 && <p className="empty-chart">No medicine orders yet.</p>}
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="quick-stats-row">
              <div className="quick-stat">
                <div className="quick-stat-icon">IP</div>
                <div className="quick-stat-info">
                  <span className="quick-stat-value">{inPersonAppointments}</span>
                  <span className="quick-stat-label">In-Person Consultations</span>
                </div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-icon">VC</div>
                <div className="quick-stat-info">
                  <span className="quick-stat-value">{videoAppointments}</span>
                  <span className="quick-stat-label">Video Consultations</span>
                </div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-icon">RX</div>
                <div className="quick-stat-info">
                  <span className="quick-stat-value">{prescriptions.length}</span>
                  <span className="quick-stat-label">Total Prescriptions</span>
                </div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-icon">UP</div>
                <div className="quick-stat-info">
                  <span className="quick-stat-value">{upcomingAppointments}</span>
                  <span className="quick-stat-label">Upcoming Appointments</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== USER MANAGEMENT ==================== */}
        {activeSection === 'users' && (
          <div className="section-users">
            <div className="section-header">
              <h2>👥 User Management</h2>
              <div className="section-filters">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* User Tabs */}
            <div className="user-tabs">
              <button 
                className={`user-tab ${activeUserTab === 'patients' ? 'active' : ''}`}
                onClick={() => setActiveUserTab('patients')}
              >
                👤 Patients ({patientUsers.length})
              </button>
              <button 
                className={`user-tab ${activeUserTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveUserTab('doctors')}
              >
                👨‍⚕️ Doctors ({doctorUsers.length})
              </button>
              <button 
                className={`user-tab ${activeUserTab === 'pharmacists' ? 'active' : ''}`}
                onClick={() => setActiveUserTab('pharmacists')}
              >
                💊 Pharmacists ({pharmacistUsers.length})
              </button>
            </div>

            {/* Users Table */}
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterUsers(
                    activeUserTab === 'patients' ? patientUsers :
                    activeUserTab === 'doctors' ? doctorUsers : pharmacistUsers
                  ).map(user => (
                    <tr key={user.id} className={user.isBlocked ? 'blocked-row' : ''}>
                      <td>#{user.id}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">{user.name.charAt(0)}</div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>
                        <span className={`badge ${user.isBlocked ? 'badge-danger' : 'badge-success'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button className="btn-sm btn-secondary">View</button>
                          <button 
                            className={`btn-sm ${user.isBlocked ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => handleToggleBlock(user.id)}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== DOCTOR VERIFICATION ==================== */}
        {activeSection === 'doctors' && (
          <div className="section-doctors">
            <div className="section-header">
              <h2>👨‍⚕️ Doctor Verification</h2>
            </div>

            {/* Pending Verifications */}
            <div className="verification-section">
              <h3>⏳ Pending Verifications ({pendingDoctors.length})</h3>
              {pendingDoctors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h3>All Caught Up!</h3>
                  <p>No pending doctor verifications</p>
                </div>
              ) : (
                <div className="verification-cards">
                  {pendingDoctors.map(doctor => (
                    <div key={doctor.id} className="verification-card">
                      <div className="verification-header">
                        <div className="doctor-avatar-large">{doctor.name.charAt(0)}</div>
                        <div className="doctor-info">
                          <h4>{doctor.name}</h4>
                          <span className="specialization">{doctor.specialization}</span>
                        </div>
                        <span className="badge badge-warning">Pending</span>
                      </div>
                      <div className="verification-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="label">Experience:</span>
                            <span className="value">{doctor.experience}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Education:</span>
                            <span className="value">{doctor.education}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Location:</span>
                            <span className="value">{doctor.location}, {doctor.city}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Consultation Fee:</span>
                            <span className="value">{formatInr(doctor.fee)}</span>
                          </div>
                        </div>
                        <div className="documents-section">
                          <h5>📄 Required Documents</h5>
                          <div className="document-list">
                            <span className="document-item">✅ Medical License</span>
                            <span className="document-item">✅ Degree Certificate</span>
                            <span className="document-item">✅ ID Proof</span>
                          </div>
                        </div>
                      </div>
                      <div className="verification-actions">
                        <button className="btn btn-danger">Reject</button>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleVerifyDoctor(doctor.id)}
                        >
                          ✅ Approve & Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Doctors */}
            <div className="verification-section">
              <h3>✅ Verified Doctors ({doctors.length - pendingDoctors.length})</h3>
              <div className="verified-doctors-table">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialization</th>
                      <th>Verified On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.filter(d => getDoctorVerificationStatus(d.id).status === 'Verified').map(doctor => {
                      const verification = getDoctorVerificationStatus(doctor.id);
                      return (
                        <tr key={doctor.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-small">{doctor.name.charAt(0)}</div>
                              <span>{doctor.name}</span>
                            </div>
                          </td>
                          <td>{doctor.specialization}</td>
                          <td>{verification.verifiedAt ? new Date(verification.verifiedAt).toLocaleDateString() : '-'}</td>
                          <td>
                            <span className="badge badge-success">Verified</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== APPOINTMENT MONITORING ==================== */}
        {activeSection === 'appointments' && (
          <div className="section-appointments">
            <div className="section-header">
              <h2>📅 Appointment Monitoring</h2>
              <div className="section-filters">
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Appointment Stats */}
            <div className="appointment-stats">
              <div className="apt-stat">
                <span className="apt-stat-value">{stats.totalAppointments}</span>
                <span className="apt-stat-label">Total</span>
              </div>
              <div className="apt-stat completed">
                <span className="apt-stat-value">{stats.completedAppointments}</span>
                <span className="apt-stat-label">Completed</span>
              </div>
              <div className="apt-stat cancelled">
                <span className="apt-stat-value">{stats.cancelledAppointments}</span>
                <span className="apt-stat-label">Cancelled</span>
              </div>
              <div className="apt-stat rate">
                <span className="apt-stat-value">{stats.cancellationRate}%</span>
                <span className="apt-stat-label">Cancellation Rate</span>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="appointments-table-container">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Symptoms</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(apt => 
                    !searchQuery || 
                    getUserById(apt.patientId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    getDoctorById(apt.doctorId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(apt => {
                    const patient = getUserById(apt.patientId);
                    const doctor = getDoctorById(apt.doctorId);
                    return (
                      <tr key={apt.id}>
                        <td>#{apt.id}</td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">{patient?.name?.charAt(0) || '?'}</div>
                            <span>{patient?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>{doctor?.name || 'Unknown'}</td>
                        <td>
                          <div className="datetime-cell">
                            <span className="date">{apt.date}</span>
                            <span className="time">{apt.time}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge ${apt.type?.toLowerCase()}`}>
                            {apt.type === 'Video' ? '📹' : '🏥'} {apt.type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${
                            apt.status === 'Completed' ? 'success' :
                            apt.status === 'Cancelled' || apt.status === 'Rejected' ? 'danger' :
                            apt.status === 'Confirmed' || apt.status === 'Accepted' ? 'info' : 'warning'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="symptoms-cell">{apt.symptoms?.substring(0, 30)}...</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== REPORTS & ANALYTICS ==================== */}
        {activeSection === 'reports' && (
          <div className="section-reports">
            <div className="section-header">
              <h2>📊 Reports & Analytics</h2>
              <button className="btn btn-primary">📥 Export Report</button>
            </div>

            {/* Report Cards */}
            <div className="reports-grid">
              <div className="report-card">
                <div className="report-header">
                  <h3>📅 Daily Consultations</h3>
                </div>
                <div className="report-body">
                  <div className="report-stat-large">{stats.todayAppointments}</div>
                  <p>Appointments scheduled for today</p>
                  <div className="report-trend positive">
                    <span>📈 +12% from yesterday</span>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <div className="report-header">
                  <h3>💰 Revenue Summary</h3>
                </div>
                <div className="report-body">
                  <div className="report-stat-large">{formatInr(stats.totalRevenue)}</div>
                  <p>Total medicine order revenue</p>
                  <div className="report-breakdown">
                    <span>Orders: {medicineOrders.filter(o => o.status === 'Delivered').length}</span>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <div className="report-header">
                  <h3>👥 User Growth</h3>
                </div>
                <div className="report-body">
                  <div className="user-breakdown">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Patients</span>
                      <span className="breakdown-value">{stats.totalPatients}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Doctors</span>
                      <span className="breakdown-value">{stats.totalDoctors}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Pharmacists</span>
                      <span className="breakdown-value">{stats.totalPharmacists}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <div className="report-header">
                  <h3>📦 Order Reports</h3>
                </div>
                <div className="report-body">
                  <div className="order-stats">
                    <div className="order-stat-item">
                      <span className="status-dot processing"></span>
                      <span>Processing: {medicineOrders.filter(o => o.status === 'Processing').length}</span>
                    </div>
                    <div className="order-stat-item">
                      <span className="status-dot dispatched"></span>
                      <span>Dispatched: {medicineOrders.filter(o => o.status === 'Dispatched').length}</span>
                    </div>
                    <div className="order-stat-item">
                      <span className="status-dot delivered"></span>
                      <span>Delivered: {medicineOrders.filter(o => o.status === 'Delivered').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Specializations Report */}
            <div className="report-section">
              <h3>🏆 Top Specializations by Appointments</h3>
              <div className="specialization-report">
                {popularSpecs.map((spec, idx) => (
                  <div key={idx} className="spec-report-item">
                    <div className="spec-rank-badge">{idx + 1}</div>
                    <div className="spec-details">
                      <span className="spec-name">{spec.name}</span>
                      <div className="spec-progress">
                        <div 
                          className="spec-progress-bar"
                          style={{ width: `${(spec.count / (popularSpecs[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="spec-count">{spec.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SYSTEM SETTINGS ==================== */}
        {activeSection === 'settings' && (
          <div className="section-settings">
            <div className="section-header">
              <h2>⚙️ System Settings</h2>
            </div>

            <div className="settings-grid">
              <div className="settings-card">
                <div className="settings-card-header">
                  <h3>💰 Fee Configuration</h3>
                </div>
                <div className="settings-card-body">
                  <div className="setting-item">
                    <label>Default Consultation Fee (INR)</label>
                    <input
                      type="number"
                      value={tempSettings.consultationFee}
                      onChange={(e) => setTempSettings({...tempSettings, consultationFee: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="setting-item">
                    <label>Platform Commission (%)</label>
                    <input
                      type="number"
                      value={tempSettings.platformCommission}
                      onChange={(e) => setTempSettings({...tempSettings, platformCommission: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="setting-item">
                    <label>Delivery Charge (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempSettings.deliveryCharge}
                      onChange={(e) => setTempSettings({...tempSettings, deliveryCharge: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="setting-item">
                    <label>Free Delivery Threshold (INR)</label>
                    <input
                      type="number"
                      value={tempSettings.freeDeliveryThreshold}
                      onChange={(e) => setTempSettings({...tempSettings, freeDeliveryThreshold: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-header">
                  <h3>🔧 System Options</h3>
                </div>
                <div className="settings-card-body">
                  <div className="setting-item toggle">
                    <label>Enable Notifications</label>
                    <div 
                      className={`toggle-switch ${tempSettings.notificationsEnabled ? 'active' : ''}`}
                      onClick={() => setTempSettings({...tempSettings, notificationsEnabled: !tempSettings.notificationsEnabled})}
                    >
                      <div className="toggle-thumb"></div>
                    </div>
                  </div>
                  <div className="setting-item toggle">
                    <label>Auto-Approve Orders</label>
                    <div 
                      className={`toggle-switch ${tempSettings.autoApproveOrders ? 'active' : ''}`}
                      onClick={() => setTempSettings({...tempSettings, autoApproveOrders: !tempSettings.autoApproveOrders})}
                    >
                      <div className="toggle-thumb"></div>
                    </div>
                  </div>
                  <div className="setting-item toggle">
                    <label>Maintenance Mode</label>
                    <div 
                      className={`toggle-switch ${tempSettings.maintenanceMode ? 'active' : ''}`}
                      onClick={() => setTempSettings({...tempSettings, maintenanceMode: !tempSettings.maintenanceMode})}
                    >
                      <div className="toggle-thumb"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn btn-secondary" onClick={() => setTempSettings({...systemSettings})}>
                Reset Changes
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                💾 Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ Quick Settings</h2>
              <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="quick-settings">
                <div className="setting-item toggle">
                  <label>Maintenance Mode</label>
                  <div 
                    className={`toggle-switch ${tempSettings.maintenanceMode ? 'active' : ''}`}
                    onClick={() => setTempSettings({...tempSettings, maintenanceMode: !tempSettings.maintenanceMode})}
                  >
                    <div className="toggle-thumb"></div>
                  </div>
                </div>
                <div className="setting-item toggle">
                  <label>Notifications</label>
                  <div 
                    className={`toggle-switch ${tempSettings.notificationsEnabled ? 'active' : ''}`}
                    onClick={() => setTempSettings({...tempSettings, notificationsEnabled: !tempSettings.notificationsEnabled})}
                  >
                    <div className="toggle-thumb"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
