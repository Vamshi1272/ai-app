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
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // 🔁 Redirect if already admin
  useEffect(() => {
    if (user?.is_admin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // ================= STEP 1 =================
  const handleCredentials = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Enter credentials');
      return;
    }

    setLoading(true);

    try {
      // ✅ FIXED API PATH
      await api.post('/auth/admin-login', { email, password });

      toast.success('Admin OTP sent!');
      setStep('otp');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2 =================
  const handleOtp = async (e) => {
    e.preventDefault();

    if (otp.length < 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      // ✅ FIXED API PATH
      const res = await api.post('/auth/verify-admin-otp', { email, otp });

      login(res.data.user, res.data.accessToken, res.data.refreshToken);

      toast.success('Admin access granted!');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ================= BLOCK NON-ADMIN =================
  if (user && !user.is_admin) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Admin access restricted</h1>
          <p style={descStyle}>
            You are logged in as ({user.email}). Please logout and login as admin.
          </p>

          <button
            style={buttonStyle}
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
          >
            Logout & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <ShieldCheck size={40} color="#a78bfa" />
          <h1 style={{ color: 'white' }}>Admin Portal</h1>
          <p style={{ color: '#aaa' }}>
            {step === 'credentials'
              ? 'Enter admin credentials'
              : 'Enter OTP sent to your email'}
          </p>
        </div>

        {/* CARD */}
        <div style={cardStyle}>

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials}>

              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={eyeBtn}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button style={buttonStyle} disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>

            </form>
          ) : (
            <form onSubmit={handleOtp}>

              <p style={{ textAlign: 'center', color: '#aaa' }}>
                OTP sent to <b>{email}</b>
              </p>

              <OtpInput value={otp} onChange={setOtp} />

              <button style={buttonStyle} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                style={backBtn}
              >
                ← Back
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg,#0f172a,#1e1b4b)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.05)',
  padding: 30,
  borderRadius: 12,
};

const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  borderRadius: 6,
  border: '1px solid #444',
  background: 'transparent',
  color: 'white',
};

const buttonStyle = {
  width: '100%',
  padding: 12,
  background: '#7c3aed',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const backBtn = {
  marginTop: 10,
  background: 'none',
  color: '#aaa',
  border: 'none',
  cursor: 'pointer',
};

const eyeBtn = {
  position: 'absolute',
  right: 10,
  top: 12,
  background: 'none',
  border: 'none',
  color: '#aaa',
};

const titleStyle = { color: 'white' };
const descStyle = { color: '#aaa' };