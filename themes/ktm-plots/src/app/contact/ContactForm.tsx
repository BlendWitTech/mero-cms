'use client';

import { useState } from 'react';
import { submitLead } from '@/lib/cms';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('loading');
    const result = await submitLead({ ...form, source: 'contact-page' });
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
    transition: 'border-color 0.2s',
    background: '#FFFFFF',
    color: '#111827',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.825rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.4rem',
  };

  if (status === 'success') {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '3rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="28" height="28" fill="none" stroke="#065F46" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style={{ fontWeight: 800, color: '#CC1414', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Message Sent!</h3>
        <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
          Thank you for reaching out. Our team will contact you within 24 hours.
        </p>
        <button onClick={() => setStatus('idle')} className="btn-green" style={{ cursor: 'pointer' }}>
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <h3 style={{ fontWeight: 800, color: '#CC1414', fontSize: '1.25rem', marginBottom: '0.25rem' }}>Send Us a Message</h3>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
        We typically reply within a few hours during business days.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="name" style={labelStyle}>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#CC1414')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div>
            <label htmlFor="phone" style={labelStyle}>Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+977 98XXXXXXXX"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#CC1414')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" style={labelStyle}>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#CC1414')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        <div>
          <label htmlFor="message" style={labelStyle}>Message <span style={{ color: '#EF4444' }}>*</span></label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us what you're looking for — location preferences, budget, plot size, etc."
            style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
            onFocus={(e) => (e.target.style.borderColor = '#CC1414')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {status === 'error' && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.75rem 1rem', color: '#991B1B', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary"
          style={{ cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1, textAlign: 'center', fontSize: '1rem', padding: '0.9rem' }}
        >
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
