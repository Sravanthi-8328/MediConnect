import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const COUNTRY_CODES = ['+91', '+1', '+44'];
const ROLES = ['Admin', 'Doctor', 'Patient', 'Pharmacist'];
const STAFF_CREDENTIALS = [
  { role: 'Admin', email: 'admin@mediconnect.com', password: 'Admin@2026' },
  { role: 'Pharmacist', email: 'priyanka.das@mediconnect.com', password: 'Priyanka@2026' },
  { role: 'Doctor', email: 'ananya.rao@mediconnect.com', password: 'Ananya@2026' },
  { role: 'Doctor', email: 'arjun.menon@mediconnect.com', password: 'Arjun@2026' },
  { role: 'Doctor', email: 'meera.iyer@mediconnect.com', password: 'Meera@2026' },
  { role: 'Doctor', email: 'vikram.kapoor@mediconnect.com', password: 'Vikram@2026' },
  { role: 'Doctor', email: 'nisha.verma@mediconnect.com', password: 'Nisha@2026' },
  { role: 'Doctor', email: 'rohan.kulkarni@mediconnect.com', password: 'Rohan@2026' },
  { role: 'Doctor', email: 'sana.mirza@mediconnect.com', password: 'Sana@2026' },
  { role: 'Doctor', email: 'karthik.reddy@mediconnect.com', password: 'Karthik@2026' },
  { role: 'Doctor', email: 'aisha.khan@mediconnect.com', password: 'Aisha@2026' },
  { role: 'Doctor', email: 'ethan.brooks@mediconnect.com', password: 'Ethan@2026' },
  { role: 'Doctor', email: 'kavya.srinath@mediconnect.com', password: 'Kavya@2026' },
  { role: 'Doctor', email: 'mateo.alvarez@mediconnect.com', password: 'Mateo@2026' },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, setCurrentUser, users } = useAppContext();

  const [authMethod, setAuthMethod] = useState('phone');
  const [role, setRole] = useState('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isPhoneLogin = authMethod === 'phone';
  const visibleStaffCredentials = STAFF_CREDENTIALS.filter((credential) => credential.role === role);

  const roleRoute = useMemo(
    () => ({
      Admin: '/admin-dashboard',
      Doctor: '/doctor-dashboard',
      Patient: '/patient-dashboard',
      Pharmacist: '/pharmacist-dashboard',
    }),
    []
  );

  const normalizePhone = (value) => (value || '').replace(/\D/g, '');

  const findUserByPhone = (value) => {
    const target = normalizePhone(value);
    return users.find((user) => normalizePhone(user.phone) === target);
  };

  const TelehealthIllustration = () => (
    <svg
      className="auth-illustration-svg"
      viewBox="0 0 960 860"
      role="img"
      aria-label="Female doctor and patient in an online consultation scene"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#224a95" />
          <stop offset="100%" stopColor="#153670" />
        </linearGradient>
        <linearGradient id="deviceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef6ff" />
          <stop offset="100%" stopColor="#d7e7fb" />
        </linearGradient>
        <linearGradient id="coatGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e6efff" />
        </linearGradient>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd7c4" />
          <stop offset="100%" stopColor="#f0b89d" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#243a68" />
          <stop offset="100%" stopColor="#101f39" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#66d0b4" />
          <stop offset="100%" stopColor="#38b49e" />
        </linearGradient>
      </defs>

      <rect width="960" height="860" rx="40" fill="url(#bgGrad)" />
      <circle cx="120" cy="120" r="72" fill="rgba(255,255,255,0.08)" />
      <circle cx="820" cy="142" r="120" fill="rgba(255,255,255,0.08)" />
      <circle cx="862" cy="686" r="108" fill="rgba(255,255,255,0.08)" />
      <circle cx="164" cy="690" r="92" fill="rgba(255,255,255,0.05)" />

      <path d="M92 238c34-54 100-86 176-86 80 0 150 30 190 76" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="18" strokeLinecap="round" />
      <path d="M664 126c52-24 116-22 166 8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="16" strokeLinecap="round" />

      <g transform="translate(86 198)">
        <rect x="0" y="82" width="362" height="418" rx="34" fill="#183a70" />
        <rect x="24" y="104" width="314" height="366" rx="22" fill="url(#deviceGrad)" />
        <rect x="138" y="92" width="86" height="12" rx="6" fill="#b5c7db" />
        <rect x="112" y="492" width="138" height="16" rx="8" fill="#0e2347" />
        <rect x="170" y="430" width="26" height="16" rx="8" fill="#98abc0" />

        <rect x="40" y="142" width="264" height="96" rx="22" fill="rgba(99, 179, 237, 0.2)" />
        <path d="M72 198c18-34 72-34 90 0 14 26 24 52 28 78H54c4-28 8-52 18-78z" fill="url(#hairGrad)" />
        <circle cx="116" cy="184" r="42" fill="url(#skinGrad)" />
        <path d="M72 190c6-28 28-54 58-60 34-6 62 8 78 38l12 18c-12-18-30-28-52-28-26 0-50 14-68 32z" fill="url(#hairGrad)" />
        <rect x="96" y="220" width="42" height="12" rx="6" fill="#ffffff" />
        <rect x="86" y="232" width="62" height="12" rx="6" fill="#d9efff" opacity="0.9" />

        <path d="M76 262c24 8 76 8 100 0l18 116H58z" fill="url(#coatGrad)" />
        <path d="M92 266l22 46-28 70H72l0-116z" fill="#f8fbff" />
        <path d="M154 266l-20 46 26 70h16l-2-116z" fill="#edf4ff" />
        <rect x="96" y="300" width="32" height="14" rx="7" fill="#1d4fa6" />
        <circle cx="112" cy="356" r="13" fill="#1d4fa6" />
        <path d="M109 368h6v48h-6z" fill="#1d4fa6" />
        <path d="M96 416h32" stroke="#1d4fa6" strokeWidth="14" strokeLinecap="round" />
        <path d="M112 414l-22 74" stroke="#1d4fa6" strokeWidth="12" strokeLinecap="round" />
        <path d="M114 414l22 74" stroke="#1d4fa6" strokeWidth="12" strokeLinecap="round" />

        <rect x="220" y="268" width="72" height="92" rx="20" fill="rgba(255,255,255,0.9)" />
        <rect x="236" y="288" width="40" height="18" rx="9" fill="url(#accentGrad)" />
        <rect x="230" y="314" width="52" height="12" rx="6" fill="#dbeafe" />
        <circle cx="256" cy="360" r="15" fill="#1d4fa6" />
      </g>

      <path d="M388 604c74-24 176-12 236 34 16 12 20 34 12 52H356c-18-26-8-74 32-86z" fill="rgba(255,255,255,0.08)" />

      <g transform="translate(438 210)">
        <ellipse cx="158" cy="524" rx="164" ry="36" fill="#57c8ad" opacity="0.95" />

        <circle cx="208" cy="154" r="46" fill="url(#skinGrad)" />
        <path d="M170 144c10-34 84-38 98 0v34h-98z" fill="url(#hairGrad)" />
        <path d="M184 162c10-18 30-28 48-28 20 0 40 10 50 28" fill="none" stroke="#0f1f39" strokeWidth="4" opacity="0.35" />

        <path d="M172 200c26 10 78 10 102 0l18 124h-138z" fill="url(#coatGrad)" />
        <path d="M188 202l24 44-24 76h-18l2-120z" fill="#f7fbff" />
        <path d="M252 202l-18 44 22 76h18l-2-120z" fill="#eef4ff" />
        <rect x="190" y="236" width="30" height="14" rx="7" fill="#1d4fa6" />
        <circle cx="206" cy="288" r="12" fill="#1d4fa6" />
        <path d="M204 300h4v84h-4z" fill="#1d4fa6" />
        <path d="M178 360h58" stroke="#1d4fa6" strokeWidth="16" strokeLinecap="round" />
        <path d="M208 360l-28 92" stroke="#1d4fa6" strokeWidth="14" strokeLinecap="round" />
        <path d="M210 360l28 92" stroke="#1d4fa6" strokeWidth="14" strokeLinecap="round" />

        <circle cx="328" cy="204" r="38" fill="url(#skinGrad)" />
        <path d="M294 196c10-24 76-24 88 0v26h-88z" fill="#f08a5a" />
        <path d="M300 224c12-16 28-22 44-22 20 0 38 10 50 28v112h-94v-86c0-14 0-24 0-32z" fill="#f08a5a" />
        <path d="M340 310c34 28 60 64 76 114h-42c-12-30-30-56-54-74z" fill="#254b7d" />
        <path d="M290 324c-22 18-42 48-58 94h38c10-22 22-40 38-56z" fill="#254b7d" />
        <rect x="314" y="358" width="22" height="70" rx="11" fill="url(#skinGrad)" />
        <rect x="334" y="358" width="22" height="70" rx="11" fill="url(#skinGrad)" />

        <path d="M54 324c34-8 68-6 104 6" fill="none" stroke="#8fdcc9" strokeWidth="12" strokeLinecap="round" />
        <path d="M82 336c-6 34-4 64 6 94" fill="none" stroke="#8fdcc9" strokeWidth="12" strokeLinecap="round" />
        <circle cx="66" cy="420" r="22" fill="none" stroke="#8fdcc9" strokeWidth="10" />

        <path d="M0 404c0-54 30-94 76-102 22-4 48 0 68 12v124H0z" fill="#2d6d4f" />
        <circle cx="68" cy="286" r="42" fill="url(#skinGrad)" />
        <path d="M34 274c12-24 80-24 90 0v28H34z" fill="#2b4c84" />
        <path d="M40 294c10-18 28-28 48-28 22 0 40 10 50 28" fill="none" stroke="#1b355f" strokeWidth="4" opacity="0.35" />
        <rect x="42" y="314" width="52" height="18" rx="9" fill="#ffffff" />
        <rect x="50" y="334" width="34" height="14" rx="7" fill="#d8f3ea" />
      </g>

      <g opacity="0.34">
        <circle cx="124" cy="154" r="28" fill="none" stroke="#d9ebff" strokeWidth="14" />
        <circle cx="174" cy="116" r="18" fill="none" stroke="#d9ebff" strokeWidth="10" />
        <circle cx="772" cy="116" r="20" fill="none" stroke="#d9ebff" strokeWidth="10" />
      </g>
    </svg>
  );

  useEffect(() => {
    const navState = location.state || {};

    if (navState.message) {
      setSuccess(navState.message);
    }

    if (navState.role && ROLES.includes(navState.role)) {
      setRole(navState.role);
    }

    if (navState.email) {
      setEmail(navState.email);
    }

    if (navState.authMethod === 'email' || navState.authMethod === 'phone') {
      setAuthMethod(navState.authMethod);
    }

    if (Object.keys(navState).length > 0) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (name === 'phoneNumber') setPhoneNumber(value);
    if (name === 'otp') setOtp(value);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (isPhoneLogin) {
      if (!phoneNumber.trim()) {
        setError('Please enter your mobile number');
        return false;
      }
      if (!otpRequested) {
        setError('Please request OTP first');
        return false;
      }
      if (!otp.trim()) {
        setError('Please enter the OTP');
        return false;
      }
      if (otp !== demoOtp) {
        setError('Invalid OTP');
        return false;
      }
      return true;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    return true;
  };

  const handleSendOtp = () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber}`;
    const matchedUser = findUserByPhone(fullPhone) || findUserByPhone(phoneNumber);

    if (!matchedUser) {
      setError('No account found for this mobile number');
      return;
    }

    const generatedOtp = '123456';
    setDemoOtp(generatedOtp);
    setOtpRequested(true);
    setOtp('');
    setSuccess(`OTP sent to ${matchedUser.phone || fullPhone}. Use 123456 in this demo build.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    setTimeout(async () => {
      if (isPhoneLogin) {
        const fullPhone = `${countryCode}${phoneNumber}`;
        const matchedUser = findUserByPhone(fullPhone) || findUserByPhone(phoneNumber);

        if (!matchedUser) {
          setError('No account found for this mobile number');
          setLoading(false);
          return;
        }

        setCurrentUser(matchedUser);
        navigate(roleRoute[matchedUser.role] || '/');
        setLoading(false);
        return;
      }

      const result = await loginUser(email, password, role);

      if (result.success) {
        navigate(roleRoute[role]);
      } else {
        if (role === 'Patient' && /invalid credentials or role/i.test(result.message || '')) {
          setError('Patient account not found. Please create an account using Register, then login.');
        } else {
          setError(result.message);
        }
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page-v2">
      <div className="auth-shell-v2">
        <section className="auth-visual-v2">
          <div className="auth-visual-backdrop" />
          <div className="auth-visual-content">
            <div className="auth-visual-badge">Virtual consultation</div>
            <div className="auth-visual-media">
              <img
                className="auth-visual-image"
                src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80"
                alt="Board-certified doctors"
              />
              <div className="auth-visual-stats">
                <div className="auth-visual-chip">
                  <strong>400+</strong>
                  <span>Specialists</span>
                </div>
                <div className="auth-visual-chip">
                  <strong>24x7</strong>
                  <span>Care support</span>
                </div>
              </div>
            </div>
            <div className="auth-video-overlay-card">
              <div className="auth-video-overlay-row">
                <span className="auth-video-live-dot" />
                <strong>Live Video Call</strong>
              </div>
              <p>Doctors are connected with patients through secure consultation rooms.</p>
            </div>
            <div className="auth-visual-caption">
              <h2>Trusted care from board-certified doctors</h2>
              <p>Consultations, prescriptions, reports, and follow-up plans in one secure platform.</p>
            </div>
          </div>
        </section>

        <section className="auth-panel-v2">
          <div className="auth-panel-top">
            <Link to="/" className="back-home-btn">← Back to Home page</Link>
          </div>

          <div className="auth-panel-inner">
            <div className="auth-panel-header-row">
              <div className="auth-panel-brand">
                <span className="auth-mini-logo">🏥</span>
                <span>MediConnect</span>
              </div>
              <div className="auth-language-wrap">
                <span>Choose Language : </span>
                <select defaultValue="English" className="auth-language-select">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                </select>
              </div>
            </div>

            <h1 className="auth-panel-title">Login</h1>
            <p className="auth-panel-subtitle">Sign in as {role} to continue your consultation workflow.</p>

            <div className="auth-divider-row">
              <span className="auth-divider-line" />
              <span>Sign in with Email Address or Mobile Number</span>
              <span className="auth-divider-line" />
            </div>

            <div className="auth-toggle-v2" role="tablist" aria-label="Login method">
              <button
                type="button"
                className={isPhoneLogin ? 'active' : ''}
                onClick={() => {
                  setAuthMethod('phone');
                  setError('');
                  setSuccess('');
                }}
              >
                Phone
              </button>
              <button
                type="button"
                className={!isPhoneLogin ? 'active' : ''}
                onClick={() => {
                  setAuthMethod('email');
                  setError('');
                  setSuccess('');
                }}
              >
                Email
              </button>
            </div>

            {success && (
              <div className="auth-alert auth-alert-success auth-alert-v2">
                <span className="alert-icon">✓</span>
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="auth-alert auth-alert-error auth-alert-v2">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form auth-form-v2">
              <div className="auth-form-group">
                <label className="auth-label auth-label-v2">Login as</label>
                <select
                  className="auth-input"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setError('');
                    setSuccess('');
                  }}
                >
                  {ROLES.map((itemRole) => (
                    <option key={itemRole} value={itemRole}>
                      {itemRole}
                    </option>
                  ))}
                </select>
              </div>

              {isPhoneLogin ? (
                <div className="auth-form-group">
                  <label className="auth-label auth-label-v2">Mobile Number*</label>
                  <div className="phone-input-group">
                    <select
                      className="auth-input phone-country-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {COUNTRY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={phoneNumber}
                      onChange={handleChange}
                      placeholder="Mobile Number*"
                      className="auth-input phone-number-input"
                    />
                  </div>
                  <button type="button" className="otp-link-btn" onClick={handleSendOtp}>
                    Click here to Get OTP
                  </button>
                  {otpRequested && (
                    <div className="auth-form-group">
                      <label className="auth-label auth-label-v2">OTP</label>
                      <input
                        type="text"
                        name="otp"
                        value={otp}
                        onChange={handleChange}
                        placeholder="Enter OTP"
                        className="auth-input"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="auth-form-group">
                    <label className="auth-label auth-label-v2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="auth-input"
                    />
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-label auth-label-v2">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="auth-input"
                    />
                  </div>
                </>
              )}

              <button type="submit" className={`auth-btn auth-btn-v2 ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    Login
                  </>
                )}
              </button>
            </form>

            <label className="login-password-toggle">
              <input
                type="checkbox"
                checked={!isPhoneLogin}
                onChange={(e) => setAuthMethod(e.target.checked ? 'email' : 'phone')}
              />
              <span>Login with Password instead of OTP?</span>
            </label>

            <div className="auth-footer auth-footer-v2">
              <p>
                Not yet registered ?{' '}
                <Link to="/register" className="auth-link">
                  Create an account
                </Link>
              </p>
              <button type="button" className="auth-link-button" onClick={() => {}}>
                Forgot password?
              </button>
            </div>

            <p className="auth-copy-v2">2025 Copyright © All rights reserved by eGlobalDoctors</p>

            {!isPhoneLogin && role !== 'Patient' && visibleStaffCredentials.length > 0 && (
              <div className="demo-credentials demo-credentials-v2">
                <p className="demo-title">Available {role} Credentials</p>
                <div className="demo-list">
                  {visibleStaffCredentials.map((credential) => (
                    <div key={credential.email} className="demo-item">
                      <span className="demo-email">{credential.email}</span>
                      <span className="demo-role">{credential.password}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
