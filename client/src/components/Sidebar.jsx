import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, FileText, User, LogOut, Menu, X,
  Users, Shield, ClipboardList, Settings
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const userNavItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/documents', icon: <FileText size={18} />, label: 'My Documents' },
    { path: '/profile', icon: <User size={18} />, label: 'Profile' },
  ];

  const adminNavItems = [
    { path: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/admin/documents', icon: <FileText size={18} />, label: 'All Documents' },
    { path: '/admin/users', icon: <Users size={18} />, label: 'Users' },
    { path: '/admin/audit-logs', icon: <ClipboardList size={18} />, label: 'Audit Logs' },
  ];

  const navItems = user?.is_admin ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-icon"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 200, background: '#1e293b', color: 'white', display: 'none', borderRadius: 8 }}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-text">📄 DocRevamp</div>
          <div className="sidebar__logo-sub">{user?.is_admin ? '⚡ Admin Panel' : 'User Portal'}</div>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info & logout */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            {user?.is_admin && <span className="badge badge-admin" style={{ marginBottom: 8, display: 'inline-flex' }}>Admin</span>}
            <strong>{user?.full_name}</strong>
            {user?.email}
          </div>
          <button className="btn btn-outline btn-full btn-sm" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }} onClick={handleLogout}>
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
