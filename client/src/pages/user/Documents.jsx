import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FileText, Download, CreditCard, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

export default function UserDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [payingDoc, setPayingDoc] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await api.get('/api/documents');
      setDocuments(res.data.documents);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/api/documents/${doc.id}/download-processed`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocRevamp_${doc.original_filename}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const handlePayment = async (doc) => {
    setPayLoading(true);
    try {
      const intent = await api.post('/api/payments/create-intent', { documentId: doc.id });
      await api.post('/api/payments/confirm', { documentId: doc.id, paymentIntentId: intent.data.clientSecret });
      toast.success('Payment successful!');
      fetchDocs();
      setPayingDoc(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  const filtered = filter === 'all' ? documents : documents.filter(d => d.status === filter);

  const statusBadge = (status) => {
    const map = {
      pending: { cls: 'badge-pending', icon: <Clock size={12} />, label: 'Pending' },
      processing: { cls: 'badge-processing', icon: <FileText size={12} />, label: 'Processing' },
      completed: { cls: 'badge-completed', icon: <CheckCircle size={12} />, label: 'Completed' },
      cancelled: { cls: 'badge-cancelled', icon: <AlertCircle size={12} />, label: 'Cancelled' },
    };
    const s = map[status] || map.pending;
    return <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>;
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>My Documents</h1>
          <p>Track all your uploaded resumes and download enhanced versions</p>
        </div>
        <div className="page-body">
          {/* Filter tabs */}
          <div className="tabs">
            {['all', 'pending', 'processing', 'completed'].map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span style={{ marginLeft: 6, background: filter === f ? '#dbeafe' : '#f1f5f9', color: filter === f ? '#2563eb' : '#64748b', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                    {documents.filter(d => d.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <FileText size={56} style={{ color: '#e2e8f0', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontWeight: 600, color: '#94a3b8', fontSize: 16 }}>No documents found</p>
              <p style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }}>Upload a resume from your dashboard</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {filtered.map(doc => (
                <div key={doc.id} className="doc-card">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <FileText size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', wordBreak: 'break-all' }}>{doc.original_filename}</span>
                      </div>
                      <div className="doc-card__meta">
                        <span>Size: {(doc.file_size / 1024).toFixed(1)} KB</span>
                        <span>Uploaded: {new Date(doc.created_at * 1000).toLocaleDateString()}</span>
                        {doc.processed_at && <span>Processed: {new Date(doc.processed_at * 1000).toLocaleDateString()}</span>}
                        {doc.notes && <span>Notes: {doc.notes}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      {statusBadge(doc.status)}
                      <span className={`badge badge-${doc.payment_status}`}>
                        {doc.payment_status === 'paid' ? <CheckCircle size={12} /> : <CreditCard size={12} />}
                        {doc.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {doc.payment_status === 'unpaid' && (
                      <button className="btn btn-sm btn-primary" onClick={() => setPayingDoc(doc)}>
                        <CreditCard size={14} /> Pay $29.99 to Unlock
                      </button>
                    )}
                    {doc.has_processed && doc.payment_status === 'paid' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleDownload(doc)}>
                        <Download size={14} /> Download Enhanced Resume
                      </button>
                    )}
                    {doc.status === 'pending' && (
                      <span style={{ fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} /> In queue — our team will review shortly
                      </span>
                    )}
                    {doc.status === 'processing' && (
                      <span style={{ fontSize: 13, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} /> Being enhanced by our team
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payment modal */}
      {payingDoc && (
        <div className="modal-overlay" onClick={() => setPayingDoc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8 }}>Complete Payment</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Pay to enhance: <strong>{payingDoc.original_filename}</strong></p>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              <span>Resume Enhancement</span>
              <strong style={{ color: '#2563eb', fontSize: 20 }}>$29.99</strong>
            </div>
            <div className="alert alert-info" style={{ fontSize: 13 }}>
              Demo mode: No real payment processed. Add Stripe keys to go live.
            </div>
            <button className="btn btn-primary btn-full" onClick={() => handlePayment(payingDoc)} disabled={payLoading} style={{ marginBottom: 10 }}>
              {payLoading ? <span className="spinner" /> : <><CreditCard size={16} /> Pay $29.99</>}
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => setPayingDoc(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
