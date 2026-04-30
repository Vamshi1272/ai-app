import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, FileText, Clock, CheckCircle, DollarSign, ChevronRight, Activity } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(r => setStats(r.data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
        </div>
      </main>
    </div>
  );

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users size={22} />, color: '#dbeafe', iconColor: '#2563eb' },
    { label: 'Pending', value: stats?.pendingDocuments || 0, icon: <Clock size={22} />, color: '#fef3c7', iconColor: '#d97706' },
    { label: 'Processing', value: stats?.processingDocuments || 0, icon: <Activity size={22} />, color: '#e0f2fe', iconColor: '#0284c7' },
    { label: 'Completed', value: stats?.completedDocuments || 0, icon: <CheckCircle size={22} />, color: '#dcfce7', iconColor: '#16a34a' },
    { label: 'Total Documents', value: stats?.totalDocuments || 0, icon: <FileText size={22} />, color: '#f3e8ff', iconColor: '#7c3aed' },
    { label: 'Revenue', value: `$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`, icon: <DollarSign size={22} />, color: '#fce7f3', iconColor: '#db2777' },
  ];

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Overview of platform activity and statistics</p>
        </div>
        <div className="page-body">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {statCards.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-card__icon" style={{ background: s.color }}>
                  <span style={{ color: s.iconColor }}>{s.icon}</span>
                </div>
                <div>
                  <div className="stat-card__value">{s.value}</div>
                  <div className="stat-card__label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent documents */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Submissions</h2>
              <Link to="/admin/documents" className="btn btn-sm btn-secondary">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentDocuments || []).map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.original_filename}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{doc.full_name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{doc.email}</div>
                      </td>
                      <td><span className={`badge badge-${doc.status}`}>{doc.status}</span></td>
                      <td><span className={`badge badge-${doc.payment_status}`}>{doc.payment_status}</span></td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{new Date(doc.created_at * 1000).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!stats?.recentDocuments?.length) && (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No documents yet</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
