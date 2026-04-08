import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logoutUser } = useAppContext();
  const { selectedLanguage, setSelectedLanguage, languageOptions, t } = useLanguage();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <div className="navbar-title">
        {currentUser && 'MediConnect'}
      </div>
      <div className="navbar-user">
        <label className="patient-language-select" style={{ marginRight: '12px' }}>
          <span>{t('Choose Language')}</span>
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </label>
        <div className="user-info">
          <div className="user-name">{currentUser?.name}</div>
          <div className="user-role">{currentUser?.role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          {t('Logout')}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
