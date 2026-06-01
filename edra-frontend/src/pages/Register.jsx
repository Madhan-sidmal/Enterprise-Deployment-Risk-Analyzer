import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'developer', label: 'Developer', desc: 'Create and manage deployments' },
  { value: 'release_manager', label: 'Release Manager', desc: 'Approve and oversee releases' },
  { value: 'admin', label: 'Admin', desc: 'Full system access and user management' },
];

const Register = () => {
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', role: 'developer'
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        roles: [form.role],
      });
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up" style={{ maxWidth: '500px' }}>
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-badge">
              <div className="auth-logo-badge-dot" />
              <span className="auth-logo-badge-text">Create Account</span>
            </div>
            <h1 className="auth-title" style={{ marginTop: '1rem' }}>Join EDRA</h1>
            <p className="auth-subtitle">Enterprise Deployment Risk Analyzer</p>
          </div>

          {serverError && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <div className="form-input-icon-wrap">
                <svg className="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input id="fullName" type="text" name="fullName" className="form-input"
                  placeholder="John Doe" value={form.fullName} onChange={handleChange} />
              </div>
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-username">Username</label>
              <div className="form-input-icon-wrap">
                <svg className="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input id="reg-username" type="text" name="username" className="form-input"
                  placeholder="johndoe" value={form.username} onChange={handleChange} autoComplete="username" />
              </div>
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="form-input-icon-wrap">
                <svg className="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input id="email" type="email" name="email" className="form-input"
                  placeholder="john@company.com" value={form.email} onChange={handleChange} />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="form-input-icon-wrap">
                <svg className="form-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input id="reg-password" type="password" name="password" className="form-input"
                  placeholder="Min. 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {ROLES.map(r => (
                  <label key={r.value} style={{
                    display: 'flex', flexDirection: 'column', gap: '4px',
                    padding: '0.75rem', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: form.role === r.value ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <input type="radio" name="role" value={r.value}
                      checked={form.role === r.value} onChange={handleChange}
                      style={{ display: 'none' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: form.role === r.value ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {r.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? (
                <><div className="spinner" /> Creating account...</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
