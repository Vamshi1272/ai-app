import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../../components/OtpInput';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [step, setStep] = useState('credentials');
  
  useEffect(() => {
    if (user?.is_admin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter credentials'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/admin-login', { email, password });
      toast.success('Admin OTP sent!');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/verify-admin-otp', { email, otp });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Admin access granted!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (user && !user.is_admin) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 32, textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Admin access restricted</h1>
          <p style={{ color: '#cbd5e1', marginBottom: 18 }}>You are currently logged in as a non-admin user ({user.email}). Please log out before signing in as an admin.</p>
          <button
            className="btn btn-full"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700 }}
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            Logout & continue to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.4)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={36} style={{ color: '#a78bfa' }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 6 }}>Admin Portal</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            {step === 'credentials' ? 'Restricted access. Authorized personnel only.' : 'Enter the OTP sent to admin email.'}
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 36 }}>
          {step === 'credentials' ? (
            <form onSubmit={handleCredentials} noValidate>
              <div className="form-group">
                <label style={{ color: '#94a3b8' }}>Admin Email</label>
                <input className="form-input" type="email" placeholder="admin@docrevamp.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white' }} autoFocus />
              </div>
              <div className="form-group">
                <label style={{ color: '#94a3b8' }}>Admin Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Admin password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 44, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Lock size={14} style={{ flexShrink: 0 }} />
                Failed attempts are logged and may result in IP block.
              </div>
              <button type="submit" className="btn btn-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700 }} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Authenticate'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtp}>
              <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 14, color: '#c4b5fd', display: 'flex', gap: 8 }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <span>OTP sent to <strong>{email}</strong></span>
              </div>
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Enter 6-digit admin OTP</p>
              <OtpInput value={otp} onChange={setOtp} />
              <button type="submit" className="btn btn-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: 700 }} disabled={loading || otp.length < 6}>
                {loading ? <span className="spinner" /> : 'Verify & Access Admin'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setOtp(''); }} style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', marginTop: 16, cursor: 'pointer', fontSize: 14 }}>
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
