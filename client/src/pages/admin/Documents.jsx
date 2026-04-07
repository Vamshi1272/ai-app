import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Search, Filter, FileText, Eye, CheckCircle, Clock, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

function UploadModal({ doc, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [adminNotes, setAdminNotes] = useState(doc.admin_notes || '');
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    const formData = new FormData();
    formData.append('document', file);
    formData.append('admin_notes', adminNotes);
    setLoading(true);
    try {
      await api.post(`/api/admin/documents/${doc.id}/upload-processed`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Processed document uploaded! User notified.');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Upload Enhanced Document</h2>
          <button onClick={onClose} className="btn btn-icon btn-secondary"><X size={18} /></button>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Original file</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{doc.original_filename}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>User: {doc.full_name} ({doc.email})</div>
        </div>

        <div className="form-group">
          <label>Admin Notes (visible only to you)</label>
          <textarea className="form-input" rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes about enhancements made..." style={{ resize: 'vertical' }} />
        </div>

        <div
          style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', background: file ? '#f0fdf4' : '#f8fafc', marginBottom: 20, transition: 'all 0.2s' }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          <Upload size={32} style={{ color: file ? '#22c55e' : '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
          {file ? (
            <div>
              <p style={{ fontWeight: 600, color: '#166534' }}>{file.name}</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600, color: '#374151' }}>Click to select processed document</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>PDF, DOC, DOCX up to 10MB</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpload} disabled={loading || !file}>
            {loading ? <span className="spinner" /> : <><Upload size={16} /> Upload & Notify User</>}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', payment_status: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadDoc, setUploadDoc] = useState(null);
  const searchTimeout = useRef();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/api/admin/documents?${params}`);
      setDocuments(res.data.documents);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [page, filters]);

  useEffect(() => {
    return () => clearTimeout(searchTimeout.current);
  }, []);

  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: val }));
      setPage(1);
    }, 400);
  };

  const handleDownloadOriginal = async (doc) => {
    try {
      const res = await api.get(`/api/admin/documents/${doc.id}/download-original`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = doc.original_filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const handleStatusUpdate = async (docId, status) => {
    try {
      await api.patch(`/api/admin/documents/${docId}/status`, { status });
      toast.success('Status updated');
      fetchDocs();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Document Management</h1>
          <p>Review and process user-submitted documents</p>
        </div>
        <div className="page-body">
          {/* Filters */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="form-input" placeholder="Search by user or filename..." style={{ paddingLeft: 38 }}
                    value={filters.search}
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>
                <select className="form-input" style={{ width: 160 }} value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select className="form-input" style={{ width: 150 }} value={filters.payment_status} onChange={e => { setFilters(f => ({ ...f, payment_status: e.target.value })); setPage(1); }}>
                  <option value="">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <div style={{ fontSize: 14, color: '#64748b' }}>{total} results</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
              ) : documents.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <FileText size={48} style={{ margin: '0 auto 12px', display: 'block', color: '#e2e8f0' }} />
                  No documents found
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>User</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.original_filename}>
                            <FileText size={14} style={{ display: 'inline', marginRight: 6, color: '#2563eb' }} />
                            {doc.original_filename}
                          </div>
                          {doc.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Note: {doc.notes.substring(0, 40)}{doc.notes.length > 40 ? '...' : ''}</div>}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.full_name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{doc.email}</div>
                        </td>
                        <td>
                          <select
                            className="form-input"
                            style={{ width: 130, padding: '6px 10px', fontSize: 13 }}
                            value={doc.status}
                            onChange={e => handleStatusUpdate(doc.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge badge-${doc.payment_status}`}>{doc.payment_status}</span>
                          {doc.amount_paid && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>${(doc.amount_paid / 100).toFixed(2)}</div>}
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(doc.created_at * 1000).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => handleDownloadOriginal(doc)} title="Download original">
                              <Download size={14} />
                            </button>
                            <button className="btn btn-sm btn-primary" onClick={() => setUploadDoc(doc)} title="Upload enhanced version">
                              <Upload size={14} /> {doc.has_processed ? 'Re-upload' : 'Upload'}
                            </button>
                          </div>
                          {doc.has_processed && <div style={{ fontSize: 11, color: '#22c55e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Processed</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
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

      {uploadDoc && (
        <UploadModal
          doc={uploadDoc}
          onClose={() => setUploadDoc(null)}
          onSuccess={() => { setUploadDoc(null); fetchDocs(); }}
        />
      )}
    </div>
  );
}
