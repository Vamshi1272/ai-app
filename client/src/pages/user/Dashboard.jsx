import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, FileText, Clock, CheckCircle, CreditCard, Download, ChevronRight, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function PaymentModal({ doc, onClose, onPaid }) {
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    api.get('/api/payments/price').then(r => setPrice(r.data));
  }, []);

  const handleDemoPayment = async () => {
    setLoading(true);
    try {
      const intent = await api.post('/api/payments/create-intent', { documentId: doc.id });
      await api.post('/api/payments/confirm', { documentId: doc.id, paymentIntentId: intent.data.clientSecret });
      toast.success('Payment successful! (Demo Mode)');
      onPaid();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: '#dbeafe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CreditCard size={32} style={{ color: '#2563eb' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Complete Payment</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>One-time fee for resume enhancement</p>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#64748b', fontSize: 14 }}>Document</span>
            <span style={{ fontSize: 14, fontWeight: 600, maxWidth: 200, textAlign: 'right', wordBreak: 'break-all' }}>{doc.original_filename}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#2563eb' }}>{price?.displayPrice || '$29.99'}</span>
          </div>
        </div>
        <div className="alert alert-warning" style={{ fontSize: 13, marginBottom: 16 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          Demo mode active. No real payment is processed. Configure Stripe keys for live payments.
        </div>
        <button className="btn btn-primary btn-full" onClick={handleDemoPayment} disabled={loading} style={{ marginBottom: 10 }}>
          {loading ? <span className="spinner" /> : <><CreditCard size={18} /> Pay {price?.displayPrice || '$29.99'}</>}
        </button>
        <button className="btn btn-secondary btn-full" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [payingDoc, setPayingDoc] = useState(null);
  const fileRef = useRef();
  const [notes, setNotes] = useState('');

  const fetchDocs = async () => {
    try {
      const res = await api.get('/api/documents');
      setDocuments(res.data.documents);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { toast.error('Only PDF, DOC, DOCX allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max file size is 10MB'); return; }

    const formData = new FormData();
    formData.append('document', file);
    if (notes) formData.append('notes', notes);

    setUploadLoading(true);
    try {
      await api.post('/api/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded successfully!');
      setNotes('');
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/api/documents/${doc.id}/download-processed`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocRevamp_${doc.original_filename}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    processing: documents.filter(d => d.status === 'processing').length,
    completed: documents.filter(d => d.status === 'completed').length,
  };

  const statusColor = { pending: '#f59e0b', processing: '#2563eb', completed: '#22c55e', cancelled: '#ef4444' };
  const statusIcon = { pending: <Clock size={14} />, processing: <FileText size={14} />, completed: <CheckCircle size={14} />, cancelled: <AlertCircle size={14} /> };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Welcome back, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p>Manage your documents and track enhancement status</p>
        </div>
        <div className="page-body">
          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total Documents', value: stats.total, color: '#dbeafe', iconColor: '#2563eb', icon: <FileText size={22} /> },
              { label: 'Pending', value: stats.pending, color: '#fef3c7', iconColor: '#d97706', icon: <Clock size={22} /> },
              { label: 'Processing', value: stats.processing, color: '#e0f2fe', iconColor: '#0284c7', icon: <FileText size={22} /> },
              { label: 'Completed', value: stats.completed, color: '#dcfce7', iconColor: '#16a34a', icon: <CheckCircle size={22} /> },
            ].map((s, i) => (
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

          {/* Upload section */}
          <div className="card" style={{ marginBottom: 28 }}>
            <div className="card-header">
              <h2>Upload New Resume</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Notes for our team (optional)</label>
                <textarea className="form-input" rows={2} placeholder="e.g., Target role, industry, specific improvements needed..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e.target.files[0])} />
                {uploadLoading ? (
                  <div><div className="spinner spinner-dark" style={{ margin: '0 auto 12px' }} /><p>Uploading...</p></div>
                ) : (
                  <div>
                    <Upload size={40} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Drag & drop your resume here</p>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>or click to browse files</p>
                    <p style={{ color: '#cbd5e1', fontSize: 12, marginTop: 8 }}>PDF, DOC, DOCX up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents list */}
          <div className="card">
            <div className="card-header">
              <h2>My Documents</h2>
              <Link to="/documents" className="btn btn-sm btn-secondary">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
              ) : documents.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <FileText size={48} style={{ color: '#cbd5e1', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: '#94a3b8', fontWeight: 600 }}>No documents yet</p>
                  <p style={{ color: '#cbd5e1', fontSize: 14 }}>Upload your resume to get started</p>
                </div>
              ) : (
                <div style={{ padding: 20, display: 'grid', gap: 14 }}>
                  {documents.slice(0, 5).map(doc => (
                    <div key={doc.id} className="doc-card">
                      <div className="doc-card__header">
                        <div>
                          <div className="doc-card__name">{doc.original_filename}</div>
                          <div className="doc-card__meta">
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            <span>{new Date(doc.created_at * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <span className={`badge badge-${doc.status}`}>
                            {statusIcon[doc.status]} {doc.status}
                          </span>
                          <span className={`badge badge-${doc.payment_status}`}>
                            {doc.payment_status}
                          </span>
                        </div>
                      </div>
                      <div className="doc-card__actions">
                        {doc.payment_status === 'unpaid' && (
                          <button className="btn btn-sm btn-primary" onClick={() => setPayingDoc(doc)}>
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}
                        {doc.has_processed && doc.payment_status === 'paid' && (
                          <button className="btn btn-sm btn-success" onClick={() => handleDownload(doc)}>
                            <Download size={14} /> Download Enhanced
                          </button>
                        )}
                        {doc.has_processed && doc.payment_status !== 'paid' && (
                          <div className="alert alert-warning" style={{ margin: 0, padding: '6px 12px', fontSize: 12 }}>
                            <CreditCard size={14} /> Pay to unlock your enhanced document
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {payingDoc && (
        <PaymentModal
          doc={payingDoc}
          onClose={() => setPayingDoc(null)}
          onPaid={() => { setPayingDoc(null); fetchDocs(); }}
        />
      )}
    </div>
  );
}
