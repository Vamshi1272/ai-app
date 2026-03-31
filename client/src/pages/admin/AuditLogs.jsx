import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / 50);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/admin/audit-logs?page=${page}&limit=50`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, [page]);

  const actionColor = {
    upload_processed: '#22c55e',
    update_document_status: '#2563eb',
    update_user_status: '#f59e0b',
    login: '#7c3aed',
    logout: '#64748b',
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Audit Logs</h1>
          <p>Complete record of all admin actions on the platform</p>
        </div>
        <div className="page-body">
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <Shield size={18} style={{ flexShrink: 0 }} />
            All admin actions are logged with timestamp, IP address, and user agent for compliance and security.
          </div>

          <div className="card">
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
              ) : logs.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <ClipboardList size={48} style={{ margin: '0 auto 12px', display: 'block', color: '#e2e8f0' }} />
                  No audit logs yet
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Admin</th>
                      <th>Resource</th>
                      <th>IP Address</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${actionColor[log.action] || '#64748b'}18`, color: actionColor[log.action] || '#64748b' }}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>{log.email || 'System'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.user_id?.substring(0, 8) || '—'}...</div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {log.resource_type && (
                            <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
                              {log.resource_type}: {log.resource_id?.substring(0, 8) || '—'}...
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 13, fontFamily: 'monospace', color: '#64748b' }}>
                          {log.ip_address || '—'}
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at * 1000).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ padding: '16px 0' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
