import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, FileText, Shield } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../../components/OtpInput';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/login', { email, password });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err) {
      const data = err.response?.data;
      if (data?.step === 'verify_email') {
        toast.error('Email not verified. Check your inbox.');
        navigate('/register');
        return;
      }
      toast.error(data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/verify-login-otp', { email, otp });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(`Welcome back, ${res.data.user.full_name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api.post('/api/auth/resend-otp', { email, type: 'login' });
      toast.success('New OTP sent!');
    } catch { toast.error('Failed to resend OTP'); }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <FileText size={48} style={{ marginBottom: 24, opacity: 0.9 }} />
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Welcome Back</h2>
          <p style={{ fontSize: 16, opacity: 0.8, lineHeight: 1.7, marginBottom: 32 }}>
            Access your enhanced resumes and track your document processing status.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Shield size={20} style={{ color: '#86efac' }} />
              <span style={{ fontWeight: 600 }}>2-Factor Authentication</span>
            </div>
            <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
              Every login is protected with a one-time password sent to your email for maximum security.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-page__form-side">
        <div className="form-card">
          <div className="form-card__logo">📄 DocRevamp</div>
          <p className="form-card__subtitle">
            {step === 'credentials' ? 'Sign in to your account' : 'Enter verification code'}
          </p>

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} noValidate>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtp}>
              <div className="alert alert-info">
                <Shield size={18} style={{ flexShrink: 0 }} />
                <span>OTP sent to <strong>{email}</strong></span>
              </div>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14 }}>Enter the 6-digit code</p>
              <OtpInput value={otp} onChange={setOtp} />
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length < 6}>
                {loading ? <span className="spinner" /> : 'Verify & Sign In'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 14, color: '#64748b' }}>
                <button type="button" onClick={() => { setStep('credentials'); setOtp(''); }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  ← Change email
                </button>
                <button type="button" onClick={resendOtp} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
