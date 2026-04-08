import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const PharmacistDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentUser,
    prescriptions,
    medicineOrders,
    inventory,
    getPrescriptionsForPharmacist,
    getPharmacistStats,
    getLowStockItems,
    updateInventoryItem,
    addInventoryItem,
    acceptPrescriptionOrder,
    updateOrderStatusWithTimeline,
    getUserById,
    getNotificationsByUser,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAppContext();
  const { selectedLanguage, setSelectedLanguage, languageOptions, t } = useLanguage();

  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventoryStockFilter, setInventoryStockFilter] = useState('all');

  // New inventory item form
  const [newInventoryItem, setNewInventoryItem] = useState({
    name: '',
    category: '',
    stock: '',
    minStock: '',
    price: '',
    unit: 'tablets',
    supplier: '',
    expiryDate: ''
  });

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

  const formatInr = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

  // Get data
  const stats = getPharmacistStats();
  const prescriptionQueue = getPrescriptionsForPharmacist();
  const lowStockItems = getLowStockItems();
  const notifications = getNotificationsByUser(currentUser.id);
  const unreadCount = getUnreadNotificationsCount(currentUser.id);
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const expiringSoonItems = inventory.filter((item) => new Date(item.expiryDate) < ninetyDaysFromNow);
  const inventoryValue = inventory.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.stock || 0), 0);
  const inventoryCategories = [...new Set(inventory.map((item) => item.category).filter(Boolean))].sort();

  // Filter prescriptions
  const filteredPrescriptions = prescriptionQueue.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.orderStatus === filterStatus;
    const matchesSearch = searchQuery === '' || 
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter orders
  const filteredOrders = medicineOrders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const patient = getUserById(order.patientId);
    const matchesSearch = searchQuery === '' || 
      patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredInventory = inventory.filter((item) => {
    const query = inventorySearchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || (item.name || '').toLowerCase().includes(query)
      || (item.supplier || '').toLowerCase().includes(query)
      || (item.category || '').toLowerCase().includes(query);

    const matchesCategory = inventoryCategoryFilter === 'all' || item.category === inventoryCategoryFilter;

    const isLow = Number(item.stock || 0) <= Number(item.minStock || 0);
    const isOut = Number(item.stock || 0) <= 0;
    const isExpiring = new Date(item.expiryDate) < ninetyDaysFromNow;

    let matchesStock = true;
    if (inventoryStockFilter === 'low') matchesStock = isLow;
    if (inventoryStockFilter === 'out') matchesStock = isOut;
    if (inventoryStockFilter === 'expiring') matchesStock = isExpiring;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleExportInventoryCsv = () => {
    if (filteredInventory.length === 0) {
      alert('No inventory rows to export for current filters.');
      return;
    }

    const csvLines = [
      ['Medicine', 'Category', 'Stock', 'MinStock', 'Price', 'Unit', 'Supplier', 'ExpiryDate'].join(','),
      ...filteredInventory.map((item) => [
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        Number(item.stock || 0),
        Number(item.minStock || 0),
        Number(item.price || 0).toFixed(2),
        `"${(item.unit || '').replace(/"/g, '""')}"`,
        `"${(item.supplier || '').replace(/"/g, '""')}"`,
        item.expiryDate || '',
      ].join(',')),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle accept order
  const handleAcceptOrder = (prescription) => {
    const patient = getUserById(prescription.patientId);
    acceptPrescriptionOrder(prescription.id, prescription.patientId, patient?.address || '123 Main St, New York, NY');
    setShowOrderModal(false);
    setSelectedPrescription(null);
  };

  // Handle status update
  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatusWithTimeline(orderId, newStatus);
  };

  // Handle add inventory item
  const handleAddInventoryItem = (e) => {
    e.preventDefault();
    addInventoryItem({
      ...newInventoryItem,
      stock: parseInt(newInventoryItem.stock),
      minStock: parseInt(newInventoryItem.minStock),
      price: parseFloat(newInventoryItem.price)
    });
    setNewInventoryItem({
      name: '',
      category: '',
      stock: '',
      minStock: '',
      price: '',
      unit: 'tablets',
      supplier: '',
      expiryDate: ''
    });
    setShowInventoryModal(false);
  };

  // Handle update stock
  const handleUpdateStock = (itemId, newStock) => {
    updateInventoryItem(itemId, { stock: parseInt(newStock) });
  };

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Awaiting Processing': 'badge-warning',
      'Processing': 'badge-info',
      'Preparing': 'badge-info',
      'Ready': 'badge-success',
      'Dispatched': 'badge-primary',
      'Out for Delivery': 'badge-primary',
      'Delivered': 'badge-success'
    };
    return colors[status] || 'badge-secondary';
  };

  return (
    <div className="pharmacist-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="greeting">
          <h1>{t('Pharmacy Dashboard')} 💊</h1>
          <p>Welcome back, {currentUser.name}. Manage prescriptions and orders.</p>
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
          <div className="user-avatar">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>{t('Notifications')}</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllNotificationsAsRead(currentUser.id)}>{t('Mark all read')}</button>
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
                  <div className="notification-icon">📋</div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
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
          <span>🏠</span> {t('Dashboard')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'prescriptions' ? 'active' : ''}`}
          onClick={() => handleSectionChange('prescriptions')}
        >
          <span>📋</span> {t('Prescriptions')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'orders' ? 'active' : ''}`}
          onClick={() => handleSectionChange('orders')}
        >
          <span>📦</span> {t('Orders')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'inventory' ? 'active' : ''}`}
          onClick={() => handleSectionChange('inventory')}
        >
          <span>🏪</span> {t('Inventory')}
        </button>
        <button 
          className={`nav-tab ${activeSection === 'delivery' ? 'active' : ''}`}
          onClick={() => handleSectionChange('delivery')}
        >
          <span>🚚</span> Delivery
        </button>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">

        {/* ==================== DASHBOARD HOME ==================== */}
        {activeSection === 'dashboard' && (
          <div className="section-dashboard">
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card stat-warning" onClick={() => handleSectionChange('prescriptions')}>
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.pendingPrescriptions}</div>
                  <div className="stat-label">New Prescriptions</div>
                </div>
              </div>
              <div className="stat-card stat-info" onClick={() => handleSectionChange('orders')}>
                <div className="stat-icon">⚙️</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.processingOrders}</div>
                  <div className="stat-label">Orders in Progress</div>
                </div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.readyOrders}</div>
                  <div className="stat-label">Ready for Pickup</div>
                </div>
              </div>
              <div className="stat-card stat-primary" onClick={() => handleSectionChange('delivery')}>
                <div className="stat-icon">🚚</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.dispatchedOrders}</div>
                  <div className="stat-label">Out for Delivery</div>
                </div>
              </div>
              <div className="stat-card stat-success" onClick={() => handleSectionChange('inventory')}>
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-value">{formatInr(inventoryValue)}</div>
                  <div className="stat-label">Inventory Value</div>
                </div>
              </div>
              <div className="stat-card stat-warning" onClick={() => handleSectionChange('inventory')}>
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <div className="stat-value">{expiringSoonItems.length}</div>
                  <div className="stat-label">Expiring in 90 Days</div>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="alert-card alert-danger">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h3>Low Stock Alert</h3>
                  <p>{lowStockItems.length} items are running low on stock</p>
                  <div className="low-stock-items">
                    {lowStockItems.slice(0, 3).map(item => (
                      <span key={item.id} className="low-stock-tag">
                        {item.name}: {item.stock} left
                      </span>
                    ))}
                  </div>
                </div>
                <button className="btn-sm btn-primary" onClick={() => handleSectionChange('inventory')}>
                  View Inventory
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn" onClick={() => handleSectionChange('prescriptions')}>
                  <span className="action-icon">📋</span>
                  <span>View New Orders</span>
                </button>
                <button className="action-btn" onClick={() => handleSectionChange('inventory')}>
                  <span className="action-icon">📦</span>
                  <span>Update Stock</span>
                </button>
                <button className="action-btn" onClick={() => handleSectionChange('delivery')}>
                  <span className="action-icon">🚚</span>
                  <span>Manage Deliveries</span>
                </button>
                <button className="action-btn" onClick={() => { handleSectionChange('inventory'); setShowInventoryModal(true); }}>
                  <span className="action-icon">➕</span>
                  <span>Add Medicine</span>
                </button>
                <button className="action-btn" onClick={() => { handleSectionChange('inventory'); setInventoryStockFilter('expiring'); }}>
                  <span className="action-icon">⏳</span>
                  <span>Expiring Soon</span>
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="recent-orders">
              <h2>Recent Orders</h2>
              <div className="orders-list">
                {medicineOrders.slice(0, 5).map(order => {
                  const patient = getUserById(order.patientId);
                  return (
                    <div key={order.id} className="order-item">
                      <div className="order-info">
                        <div className="order-id">#{order.trackingId}</div>
                        <div className="order-patient">{patient?.name}</div>
                      </div>
                      <div className="order-date">{order.orderDate}</div>
                      <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRESCRIPTION QUEUE ==================== */}
        {activeSection === 'prescriptions' && (
          <div className="section-prescriptions">
            <div className="section-header">
              <h2>📋 Prescription Queue</h2>
              <div className="section-filters">
                <input
                  type="text"
                  placeholder="Search by patient or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="Awaiting Processing">Awaiting Processing</option>
                  <option value="Processing">Processing</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                </select>
              </div>
            </div>

            <div className="prescriptions-grid">
              {filteredPrescriptions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No Prescriptions Found</h3>
                  <p>No prescriptions match your current filters</p>
                </div>
              ) : (
                filteredPrescriptions.map(prescription => (
                  <div key={prescription.id} className="prescription-card">
                    <div className="prescription-header">
                      <span className="prescription-id">RX-{prescription.id.toString().padStart(4, '0')}</span>
                      <span className={`badge ${getStatusColor(prescription.orderStatus)}`}>
                        {prescription.orderStatus}
                      </span>
                    </div>
                    
                    <div className="prescription-body">
                      <div className="prescription-info">
                        <div className="info-row">
                          <span className="label">👤 Patient:</span>
                          <span className="value">{prescription.patientName}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">👨‍⚕️ Doctor:</span>
                          <span className="value">{prescription.doctorName}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">📅 Date:</span>
                          <span className="value">{new Date(prescription.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="medicines-list">
                        <h4>💊 Medicines:</h4>
                        <ul>
                          {prescription.medicines.map((med, idx) => (
                            <li key={idx}>
                              <span className="med-name">{med.name}</span>
                              <span className="med-dosage">{med.dosage} - {med.frequency}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {prescription.notes && (
                        <div className="prescription-notes">
                          <h4>📝 Instructions:</h4>
                          <p>{prescription.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="prescription-actions">
                      {prescription.orderStatus === 'Awaiting Processing' && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setShowOrderModal(true);
                          }}
                        >
                          Accept Order
                        </button>
                      )}
                      {prescription.orderId && (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => {
                            const order = medicineOrders.find(o => o.id === prescription.orderId);
                            setSelectedOrder(order);
                          }}
                        >
                          View Order
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== ORDERS SECTION ==================== */}
        {activeSection === 'orders' && (
          <div className="section-orders">
            <div className="section-header">
              <h2>📦 Medicine Orders</h2>
              <div className="section-filters">
                <input
                  type="text"
                  placeholder="Search by tracking ID or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="Processing">Processing</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Patient</th>
                    <th>Medicines</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const patient = getUserById(order.patientId);
                    return (
                      <tr key={order.id}>
                        <td className="order-id-cell">
                          <span className="tracking-id">{order.trackingId}</span>
                          <span className="order-date">{order.orderDate}</span>
                        </td>
                        <td>
                          <div className="patient-cell">
                            <span className="patient-name">{patient?.name}</span>
                            <span className="patient-address">{order.address?.substring(0, 30)}...</span>
                          </div>
                        </td>
                        <td>
                          <div className="medicines-cell">
                            {order.medicines.slice(0, 2).map((med, idx) => (
                              <span key={idx} className="med-tag">{med.name}</span>
                            ))}
                            {order.medicines.length > 2 && (
                              <span className="med-more">+{order.medicines.length - 2} more</span>
                            )}
                          </div>
                        </td>
                        <td className="amount-cell">{formatInr(order.totalAmount)}</td>
                        <td>
                          <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            {order.status === 'Processing' && (
                              <button 
                                className="btn-sm btn-info"
                                onClick={() => handleStatusUpdate(order.id, 'Preparing')}
                              >
                                Mark Preparing
                              </button>
                            )}
                            {order.status === 'Preparing' && (
                              <button 
                                className="btn-sm btn-success"
                                onClick={() => handleStatusUpdate(order.id, 'Ready')}
                              >
                                Mark Ready
                              </button>
                            )}
                            {order.status === 'Ready' && (
                              <button 
                                className="btn-sm btn-primary"
                                onClick={() => handleStatusUpdate(order.id, 'Dispatched')}
                              >
                                Dispatch
                              </button>
                            )}
                            {order.status === 'Dispatched' && (
                              <button 
                                className="btn-sm btn-success"
                                onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== INVENTORY SECTION ==================== */}
        {activeSection === 'inventory' && (
          <div className="section-inventory">
            <div className="section-header">
              <h2>🏪 Inventory Management</h2>
              <div className="section-filters">
                <input
                  type="text"
                  placeholder="Search by medicine, category, supplier..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  className="search-input"
                />
                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {inventoryCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={inventoryStockFilter}
                  onChange={(e) => setInventoryStockFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                  <option value="expiring">Expiring Soon</option>
                </select>
                <button className="btn btn-secondary" onClick={handleExportInventoryCsv}>
                  ⬇ Export CSV
                </button>
                <button className="btn btn-primary" onClick={() => setShowInventoryModal(true)}>
                  ➕ Add Medicine
                </button>
              </div>
            </div>

            {/* Low Stock Warning */}
            {lowStockItems.length > 0 && (
              <div className="low-stock-banner">
                <span className="warning-icon">⚠️</span>
                <span>{lowStockItems.length} items are below minimum stock level</span>
              </div>
            )}

            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Min Stock</th>
                    <th>Price</th>
                    <th>Supplier</th>
                    <th>Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => (
                    <tr key={item.id} className={item.stock <= item.minStock ? 'low-stock-row' : ''}>
                      <td>
                        <div className="medicine-cell">
                          <span className="medicine-name">{item.name}</span>
                          <span className="medicine-unit">{item.unit}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">{item.category}</span>
                      </td>
                      <td>
                        <div className="stock-cell">
                          <input
                            type="number"
                            value={item.stock}
                            onChange={(e) => handleUpdateStock(item.id, e.target.value)}
                            className="stock-input"
                            min="0"
                          />
                          {item.stock <= item.minStock && (
                            <span className="low-indicator">Low!</span>
                          )}
                        </div>
                      </td>
                      <td>{item.minStock}</td>
                      <td>{formatInr(item.price)}</td>
                      <td>{item.supplier}</td>
                      <td>
                        <span className={`expiry-date ${new Date(item.expiryDate) < new Date(Date.now() + 90*24*60*60*1000) ? 'expiring-soon' : ''}`}>
                          {item.expiryDate}
                        </span>
                      </td>
                      <td>
                        <button className="btn-sm btn-secondary">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🔎</div>
                  <h3>No medicines found</h3>
                  <p>Try adjusting the inventory filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== DELIVERY TRACKING ==================== */}
        {activeSection === 'delivery' && (
          <div className="section-delivery">
            <div className="section-header">
              <h2>🚚 Delivery Tracking</h2>
            </div>

            <div className="delivery-cards">
              {medicineOrders.filter(o => ['Dispatched', 'Out for Delivery', 'Ready'].includes(o.status)).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No Active Deliveries</h3>
                  <p>All orders have been delivered or are still being prepared</p>
                </div>
              ) : (
                medicineOrders
                  .filter(o => ['Ready', 'Dispatched', 'Out for Delivery'].includes(o.status))
                  .map(order => {
                    const patient = getUserById(order.patientId);
                    return (
                      <div key={order.id} className="delivery-card">
                        <div className="delivery-header">
                          <div className="delivery-id">
                            <span className="tracking">#{order.trackingId}</span>
                            <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                          </div>
                          <div className="delivery-date">{order.orderDate}</div>
                        </div>

                        <div className="delivery-body">
                          <div className="delivery-patient">
                            <h4>👤 {patient?.name}</h4>
                            <p>📍 {order.address}</p>
                          </div>

                          {/* Status Timeline */}
                          <div className="delivery-timeline">
                            <div className={`timeline-step ${order.status !== 'Ready' ? 'completed' : 'active'}`}>
                              <div className="step-icon">📦</div>
                              <div className="step-label">Packed</div>
                            </div>
                            <div className="timeline-connector"></div>
                            <div className={`timeline-step ${['Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'completed' : order.status === 'Ready' ? 'active' : ''}`}>
                              <div className="step-icon">🚚</div>
                              <div className="step-label">Dispatched</div>
                            </div>
                            <div className="timeline-connector"></div>
                            <div className={`timeline-step ${order.status === 'Out for Delivery' ? 'active' : order.status === 'Delivered' ? 'completed' : ''}`}>
                              <div className="step-icon">🏃</div>
                              <div className="step-label">Out for Delivery</div>
                            </div>
                            <div className="timeline-connector"></div>
                            <div className={`timeline-step ${order.status === 'Delivered' ? 'completed' : ''}`}>
                              <div className="step-icon">✅</div>
                              <div className="step-label">Delivered</div>
                            </div>
                          </div>

                          <div className="delivery-items">
                            <h5>Items: {order.medicines.length}</h5>
                            <p>Total: {formatInr(order.totalAmount)}</p>
                          </div>
                        </div>

                        <div className="delivery-actions">
                          {order.status === 'Ready' && (
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleStatusUpdate(order.id, 'Dispatched')}
                            >
                              🚚 Dispatch Order
                            </button>
                          )}
                          {order.status === 'Dispatched' && (
                            <button 
                              className="btn btn-info"
                              onClick={() => handleStatusUpdate(order.id, 'Out for Delivery')}
                            >
                              🏃 Out for Delivery
                            </button>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <button 
                              className="btn btn-success"
                              onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                            >
                              ✅ Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Delivered Orders History */}
            <div className="delivered-history">
              <h3>📦 Recently Delivered</h3>
              <div className="delivered-list">
                {medicineOrders.filter(o => o.status === 'Delivered').slice(0, 5).map(order => {
                  const patient = getUserById(order.patientId);
                  return (
                    <div key={order.id} className="delivered-item">
                      <div className="delivered-info">
                        <span className="delivered-id">{order.trackingId}</span>
                        <span className="delivered-patient">{patient?.name}</span>
                      </div>
                      <div className="delivered-date">
                        Delivered: {order.deliveryDate || order.orderDate}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Processing Modal */}
      {showOrderModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Process Prescription</h2>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <div className="detail-section">
                  <h3>Patient Information</h3>
                  <p><strong>Name:</strong> {selectedPrescription.patientName}</p>
                  <p><strong>Prescribed by:</strong> {selectedPrescription.doctorName}</p>
                  <p><strong>Date:</strong> {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="detail-section">
                  <h3>Medicines</h3>
                  <table className="medicines-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrescription.medicines.map((med, idx) => {
                        const inventoryItem = inventory.find(i => 
                          i.name.toLowerCase().includes(med.name.toLowerCase().split(' ')[0])
                        );
                        return (
                          <tr key={idx}>
                            <td>{med.name}</td>
                            <td>{med.dosage}</td>
                            <td>{med.frequency}</td>
                            <td>{med.duration}</td>
                            <td>
                              {inventoryItem ? (
                                <span className={inventoryItem.stock > 0 ? 'available' : 'unavailable'}>
                                  {inventoryItem.stock > 0 ? `✅ ${inventoryItem.stock} in stock` : '❌ Out of stock'}
                                </span>
                              ) : (
                                <span className="unavailable">❓ Not in inventory</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedPrescription.notes && (
                  <div className="detail-section">
                    <h3>Special Instructions</h3>
                    <p>{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => handleAcceptOrder(selectedPrescription)}>
                ✅ Confirm & Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Modal */}
      {showInventoryModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Add New Medicine</h2>
              <button className="modal-close" onClick={() => setShowInventoryModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddInventoryItem}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Medicine Name</label>
                    <input
                      type="text"
                      value={newInventoryItem.name}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={newInventoryItem.category}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, category: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Pain Relief">Pain Relief</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Antihistamine">Antihistamine</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Gastric">Gastric</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Current Stock</label>
                    <input
                      type="number"
                      value={newInventoryItem.stock}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, stock: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Minimum Stock</label>
                    <input
                      type="number"
                      value={newInventoryItem.minStock}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, minStock: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newInventoryItem.price}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, price: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      value={newInventoryItem.unit}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, unit: e.target.value})}
                    >
                      <option value="tablets">Tablets</option>
                      <option value="capsules">Capsules</option>
                      <option value="ml">ML</option>
                      <option value="bottles">Bottles</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <input
                      type="text"
                      value={newInventoryItem.supplier}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, supplier: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={newInventoryItem.expiryDate}
                      onChange={(e) => setNewInventoryItem({...newInventoryItem, expiryDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInventoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard;
