import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Zap, Star, CheckCircle, ArrowRight, Users, Award } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: <FileText size={24} />, title: 'Upload Your Resume', desc: 'Support for PDF, DOC, DOCX formats up to 10MB' },
    { icon: <Zap size={24} />, title: 'Expert Enhancement', desc: 'Our professionals refine your resume to industry standards' },
    { icon: <Shield size={24} />, title: 'Secure & Private', desc: 'Bank-grade encryption. Your data is never shared.' },
    { icon: <Award size={24} />, title: 'Download Enhanced', desc: 'Get your polished resume ready for top employers' },
  ];

  const steps = [
    { n: '01', title: 'Create Account', desc: 'Register with email OTP verification' },
    { n: '02', title: 'Upload Resume', desc: 'Upload your current resume securely' },
    { n: '03', title: 'Make Payment', desc: 'Simple one-time payment for enhancement' },
    { n: '04', title: 'Download Enhanced', desc: 'Get your professionally enhanced resume' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>
            📄 DocRevamp
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/login" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', fontSize: 14, padding: '8px 20px' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: 14, padding: '8px 20px' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="container" style={{ padding: '100px 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#93c5fd', marginBottom: 24 }}>
            <Star size={14} /> Trusted by 10,000+ professionals
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, background: 'linear-gradient(135deg, #fff 0%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Land Your Dream Job<br />With a Perfect Resume
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Upload your resume and our expert team will enhance it to make you stand out to top recruiters and ATS systems.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 12 }}>
              Enhance My Resume <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 12, color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}>
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
            {[
              { val: '10K+', label: 'Resumes Enhanced' },
              { val: '98%', label: 'Satisfaction Rate' },
              { val: '24h', label: 'Turnaround Time' },
              { val: '$29.99', label: 'One-time Fee' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa' }}>{item.val}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12 }}>How It Works</h2>
            <p style={{ color: '#64748b', fontSize: 16 }}>Simple, secure, and professional</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 32, textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(37,99,235,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#60a5fa' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12 }}>4 Simple Steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 16, padding: 28 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: 'rgba(37,99,235,0.3)', marginBottom: 12 }}>{s.n}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security section */}
      <section style={{ padding: '80px 24px', background: '#0f172a' }}>
        <div className="container" style={{ maxWidth: 800, textAlign: 'center', margin: '0 auto' }}>
          <Shield size={48} style={{ color: '#22c55e', marginBottom: 20 }} />
          <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 16 }}>Enterprise-Grade Security</h2>
          <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
            Your documents and data are protected with industry-leading security measures.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, textAlign: 'left' }}>
            {[
              'JWT Auth with refresh tokens',
              'Email OTP 2-factor verification',
              'AES-encrypted file storage',
              'Rate limiting & brute force protection',
              'CSRF & XSS protection',
              'SQL injection prevention',
              'Secure file type validation',
              'Full audit logging',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 14 }}>
                <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 16 }}>Ready to Get Started?</h2>
          <p style={{ color: '#bfdbfe', fontSize: 16, marginBottom: 32 }}>Join thousands of professionals who landed their dream jobs</p>
          <Link to="/register" className="btn" style={{ background: 'white', color: '#2563eb', padding: '14px 40px', fontSize: 16, borderRadius: 12, fontWeight: 700 }}>
            Enhance My Resume Now <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa', marginBottom: 8 }}>📄 DocRevamp</div>
        <p style={{ color: '#475569', fontSize: 13 }}>
          &copy; {new Date().getFullYear()} DocRevamp. All rights reserved. &nbsp;|&nbsp;
          <Link to="/admin/login" style={{ color: '#475569', textDecoration: 'underline' }}>Admin</Link>
        </p>
      </footer>
    </div>
  );
}
