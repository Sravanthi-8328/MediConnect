import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const { currentUser } = useAppContext();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const currentSection = searchParams.get('section') || 'dashboard';

  const isActive = (path, section) => {
    if (section) {
      return location.pathname === path && currentSection === section;
    }
    return location.pathname === path && !searchParams.get('section');
  };

  const handleNavigation = (path, section) => {
    if (section) {
      navigate(`${path}?section=${section}`);
    } else {
      navigate(path);
    }
  };

  const translateMenuLabel = (label) => t(label);

  const getMenuItems = () => {
    if (!currentUser) return [];

    const roleSpecificItems = {
      Patient: [
        { path: '/patient-dashboard', section: 'dashboard', label: 'Dashboard' },
        { path: '/patient-dashboard', section: 'appointments', label: 'Appointments' },
        { path: '/patient-dashboard', section: 'prescriptions', label: 'Prescriptions' },
        { path: '/patient-dashboard', section: 'labReports', label: 'Lab Reports' },
        { path: '/patient-dashboard', section: 'orders', label: 'Orders' },
        { path: '/patient-dashboard', section: 'records', label: 'Health Records' },
        { path: '/patient-dashboard', section: 'profile', label: 'Profile' },
      ],
      Doctor: [
        { path: '/doctor-dashboard', section: 'dashboard', label: 'Dashboard' },
        { path: '/doctor-dashboard', section: 'appointments', label: 'Appointments' },
        { path: '/doctor-dashboard', section: 'patients', label: 'My Patients' },
        { path: '/doctor-dashboard', section: 'prescriptions', label: 'Prescriptions' },
        { path: '/doctor-dashboard', section: 'schedule', label: 'Schedule' },
        { path: '/doctor-dashboard', section: 'settings', label: 'Settings' },
      ],
      Admin: [
        { path: '/admin-dashboard', section: 'dashboard', label: 'Dashboard' },
        { path: '/admin-dashboard', section: 'users', label: 'User Management' },
        { path: '/admin-dashboard', section: 'doctors', label: 'Doctor Verification' },
        { path: '/admin-dashboard', section: 'appointments', label: 'Appointments' },
        { path: '/admin-dashboard', section: 'reports', label: 'Reports' },
        { path: '/admin-dashboard', section: 'settings', label: 'Settings' },
      ],
      Pharmacist: [
        { path: '/pharmacist-dashboard', section: 'dashboard', label: 'Dashboard' },
        { path: '/pharmacist-dashboard', section: 'prescriptions', label: 'Prescription Queue' },
        { path: '/pharmacist-dashboard', section: 'orders', label: 'Order Processing' },
        { path: '/pharmacist-dashboard', section: 'inventory', label: 'Inventory' },
        { path: '/pharmacist-dashboard', section: 'delivery', label: 'Delivery Tracking' },
      ],
    };

    return roleSpecificItems[currentUser.role] || [];
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">🏥 MediConnect</div>
      <ul className="sidebar-menu">
        {getMenuItems().map((item, idx) => (
          <li key={idx}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.path, item.section);
              }}
              className={isActive(item.path, item.section) ? 'active' : ''}
            >
              {translateMenuLabel(item.label)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
