import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle, FileText } from 'lucide-react';
import api from '../../utils/api';
import OtpInput from '../../components/OtpInput';

function getPasswordStrength(pass) {
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[@$!%*?&]/.test(pass)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // register | verify_email
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) e.password = 'Must have uppercase, lowercase, number & special char';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/api/auth/register', { email: form.email, password: form.password, full_name: form.full_name, phone: form.phone });
      setEmail(form.email);
      toast.success('OTP sent to your email!');
      setStep('verify_email');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach(e => { fieldErrors[e.path] = e.msg; });
        setErrors(fieldErrors);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/verify-email', { email, otp });
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api.post('/api/auth/resend-otp', { email, type: 'email_verification' });
      toast.success('New OTP sent!');
    } catch { toast.error('Failed to resend OTP'); }
  };

  if (step === 'verify_email') {
    return (
      <div className="auth-page">
        <div className="auth-page__hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <FileText size={48} style={{ marginBottom: 24, opacity: 0.9 }} />
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Almost There!</h2>
            <p style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.7 }}>
              We've sent a 6-digit verification code to your email. Enter it to complete your registration.
            </p>
          </div>
        </div>
        <div className="auth-page__form-side">
          <div className="form-card">
            <div className="form-card__logo">📄 DocRevamp</div>
            <p className="form-card__subtitle">Verify your email address</p>
            <div className="alert alert-info">
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>OTP sent to <strong>{email}</strong></span>
            </div>
            <form onSubmit={handleVerifyEmail}>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 8 }}>Enter the 6-digit code</p>
              <OtpInput value={otp} onChange={setOtp} />
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length < 6}>
                {loading ? <span className="spinner" /> : 'Verify Email'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
              Didn't receive code?{' '}
              <button onClick={resendOtp} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Resend OTP
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <FileText size={48} style={{ marginBottom: 24, opacity: 0.9 }} />
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Join DocRevamp</h2>
          <p style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.7, marginBottom: 32 }}>
            Get your resume professionally enhanced by our expert team.
          </p>
          {['Email OTP verification', 'Secure document storage', 'Expert resume enhancement', 'Fast 24h turnaround'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, opacity: 0.85 }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 15 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-page__form-side">
        <div className="form-card">
          <div className="form-card__logo">📄 DocRevamp</div>
          <p className="form-card__subtitle">Create your account</p>
          <form onSubmit={handleRegister} noValidate>
            <div className="form-group">
              <label>Full Name *</label>
              <input className={`form-input ${errors.full_name ? 'error' : ''}`} type="text" placeholder="John Smith" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} autoComplete="name" />
              {errors.full_name && <div className="field-error">{errors.full_name}</div>}
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone (optional)</label>
              <input className="form-input" type="tel" placeholder="+1 234 567 8900" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <div style={{ position: 'relative' }}>
                <input className={`form-input ${errors.password ? 'error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Create strong password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="password-strength">
                  <div className="password-strength__bar">
                    <div className="password-strength__fill" style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
                  </div>
                  <div className="password-strength__text" style={{ color: strength.color }}>{strength.label}</div>
                </div>
              )}
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input className={`form-input ${errors.confirm_password ? 'error' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} autoComplete="new-password" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirm_password && <div className="field-error">{errors.confirm_password}</div>}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
