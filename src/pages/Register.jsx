import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Register = () => {
  const navigate = useNavigate();
  const { registerUser } = useAppContext();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Patient',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = ['Patient', 'Doctor', 'Pharmacist', 'Admin'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    setTimeout(async () => {
      const result = await registerUser(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.phone
      );

      if (result.success) {
        navigate('/login', {
          state: {
            message: result.message,
            role: formData.role,
            email: formData.email,
            authMethod: 'email',
          },
        });
      } else {
        setError(result.message);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-shape shape-1"></div>
        <div className="auth-shape shape-2"></div>
        <div className="auth-shape shape-3"></div>
      </div>

      <div className="auth-card register-card">
        <div className="auth-card-top">
          <Link to="/" className="auth-home-link">← Back to Home page</Link>
        </div>

        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">MediConnect</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join MediConnect to manage your healthcare</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">
              <span className="label-icon">👤</span>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">
              <span className="label-icon">📧</span>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">
              <span className="label-icon">📱</span>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your mobile number"
              className="auth-input"
            />
          </div>

          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                className="auth-input"
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">
                <span className="label-icon">🔒</span>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">
              <span className="label-icon">🎭</span>
              Register As
            </label>
            <div className="role-selector">
              {roles.map((role) => (
                <label
                  key={role}
                  className={`role-option ${formData.role === role ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={handleChange}
                  />
                  <span className="role-icon">
                    {role === 'Patient' && '👤'}
                    {role === 'Doctor' && '👨‍⚕️'}
                    {role === 'Pharmacist' && '💊'}
                    {role === 'Admin' && '🛡️'}
                  </span>
                  <span className="role-name">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={`auth-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <span>✨</span>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
