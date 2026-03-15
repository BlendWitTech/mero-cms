'use client';

import { useState } from 'react';
import { submitLead } from '@/lib/cms';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  requestType: string;
  title: string;
  description: string;
}

export default function RequestModal({ isOpen, onClose, requestType, title, description }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus('loading');
    const result = await submitLead({
      ...form,
      source: requestType,
      message: form.message || `Request type: ${requestType}`,
    });
    if (result.success) {
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } else {
      setStatus('error');
      setErrorMsg(result.message || 'Something went wrong.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    background: '#FFFFFF',
    color: '#111827',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.35rem',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#1E1E1E', padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#CC1414', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>{requestType.replace(/-/g, ' ')}</div>
            <h3 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>{title}</h3>
            <p style={{ color: '#A0A0A0', fontSize: '0.82rem', marginTop: '0.4rem' }}>{description}</p>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '0.25rem', marginLeft: '1rem', flexShrink: 0 }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ width: '56px', height: '56px', background: '#1E1E1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <svg width="24" height="24" fill="none" stroke="#CC1414" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h4 style={{ fontWeight: 800, color: '#CC1414', marginBottom: '0.5rem' }}>Request Received!</h4>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Our team will contact you within 24 hours to follow up.
              </p>
              <button onClick={onClose} style={{ background: '#CC1414', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.65rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input name="name" required value={form.name} onChange={handleChange} placeholder="Your name" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#CC1414')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+977 98XXXXXXXX" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#CC1414')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email <span style={{ color: '#EF4444' }}>*</span></label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#CC1414')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
              <div>
                <label style={labelStyle}>Message / Notes</label>
                <textarea name="message" rows={3} value={form.message} onChange={handleChange}
                  placeholder="Any additional details, preferred timing, plot location interest, etc."
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                  onFocus={e => (e.target.style.borderColor = '#CC1414')} onBlur={e => (e.target.style.borderColor = '#E5E7EB')} />
              </div>

              {status === 'error' && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.65rem 1rem', color: '#991B1B', fontSize: '0.825rem' }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ background: '#CC1414', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0.85rem', fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontSize: '0.95rem', opacity: status === 'loading' ? 0.7 : 1 }}
              >
                {status === 'loading' ? 'Submitting...' : `Submit ${title}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
