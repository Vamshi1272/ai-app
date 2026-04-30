import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Search, Users, FileText, Shield, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchTimeout = useRef();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(search ? { search } : {}) });
      const res = await api.get(`/api/admin/users?${params}`);
      setUsers(res.data.users);
      setTotal(res.data.total);
      setTotalPages(Math.ceil(res.data.total / 20));
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>User Management</h1>
          <p>View and manage registered users</p>
        </div>
        <div className="page-body">
          {/* Search bar */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="form-input" placeholder="Search by name or email..." style={{ paddingLeft: 38 }} onChange={e => handleSearch(e.target.value)} />
                </div>
                <div style={{ fontSize: 14, color: '#64748b' }}>{total} users</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
              ) : users.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <Users size={48} style={{ margin: '0 auto 12px', display: 'block', color: '#e2e8f0' }} />
                  No users found
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Contact</th>
                      <th>Verification</th>
                      <th>Docs</th>
                      <th>Joined</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {user.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{user.full_name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>ID: {user.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 14 }}>{user.email}</div>
                          {user.phone && <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.phone}</div>}
                        </td>
                        <td>
                          {user.email_verified ? (
                            <span className="badge badge-completed"><Shield size={12} /> Verified</span>
                          ) : (
                            <span className="badge badge-unpaid">Unverified</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                            <FileText size={14} style={{ color: '#64748b' }} />
                            {user.doc_count}
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>
                          {new Date(user.created_at * 1000).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className={`badge ${user.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                              {user.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              style={{ fontSize: 12, padding: '5px 10px' }}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
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
