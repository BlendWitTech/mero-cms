'use client';

import { useState, FormEvent } from 'react';
import { submitLead } from '@/lib/cms';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const result = await submitLead({ ...form, source: 'marketing-contact' });
    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      setForm({ name: '', email: '', company: '', message: '' });
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" type="text" value={form.name} onChange={set('name')} placeholder="Your name" required disabled={status === 'loading'} />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required disabled={status === 'loading'} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Company</label>
        <input className="form-input" type="text" value={form.company} onChange={set('company')} placeholder="Your company (optional)" disabled={status === 'loading'} />
      </div>

      <div className="form-group">
        <label className="form-label">Message *</label>
        <textarea className="form-input" value={form.message} onChange={set('message')} placeholder="How can we help? Tell us about your project..." required disabled={status === 'loading'} style={{ minHeight: '140px' }} />
      </div>

      {/* Feedback */}
      {message && (
        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius)',
          fontSize: '0.875rem',
          background: status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${status === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: status === 'success' ? 'var(--color-success)' : '#ef4444',
        }}>
          {message}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === 'loading' || status === 'success'}
        style={{ alignSelf: 'flex-start', opacity: status === 'loading' ? 0.7 : 1 }}
      >
        {status === 'loading' ? 'Sending…' : status === 'success' ? 'Sent ✓' : 'Send Message →'}
      </button>
    </form>
  );
}
