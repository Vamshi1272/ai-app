import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Shield, Eye, EyeOff, Save } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function UserProfile() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passErrors, setPassErrors] = useState({});

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/auth/profile', form);
      setUser({ ...user, ...form });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account information and security settings</p>
        </div>
        <div className="page-body" style={{ maxWidth: 700 }}>
          {/* Profile info */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2>Account Information</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: 20, background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.full_name}</div>
                  <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                    <Mail size={14} /> {user?.email}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {user?.email_verified ? (
                      <span className="badge badge-completed"><Shield size={12} /> Verified</span>
                    ) : (
                      <span className="badge badge-unpaid">Unverified</span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfile}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input className="form-input" value={user?.email} disabled style={{ background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} />
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Email cannot be changed</div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
                </button>
              </form>
            </div>
          </div>

          {/* Security info */}
          <div className="card">
            <div className="card-header"><h2>Security</h2></div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { icon: <Shield size={20} style={{ color: '#22c55e' }} />, title: 'Two-Factor Authentication', desc: 'OTP verification is active on every login', active: true },
                  { icon: <Mail size={20} style={{ color: '#2563eb' }} />, title: 'Email Verification', desc: user?.email_verified ? 'Your email is verified' : 'Email not verified', active: !!user?.email_verified },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 10 }}>
                    <div style={{ width: 44, height: 44, background: item.active ? '#dcfce7' : '#fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{item.desc}</div>
                    </div>
                    <span className={`badge ${item.active ? 'badge-completed' : 'badge-unpaid'}`}>
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
