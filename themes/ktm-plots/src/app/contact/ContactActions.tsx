'use client';

import { useState } from 'react';
import RequestModal from './RequestModal';

const ACTIONS = [
  {
    key: 'get-a-quote',
    icon: '💰',
    title: 'Get a Quote',
    description: 'Receive a personalised price estimate for plots that match your requirements.',
    modalTitle: 'Get a Quote',
    modalDescription: 'Tell us your budget and requirements — we\'ll send a tailored quote within 24 hours.',
  },
  {
    key: 'schedule-a-visit',
    icon: '🗓️',
    title: 'Schedule a Visit',
    description: 'Book a guided site visit with one of our property experts at your convenience.',
    modalTitle: 'Schedule a Site Visit',
    modalDescription: 'Pick a date and location preference — we\'ll arrange a free guided visit.',
  },
  {
    key: 'book-a-consultant',
    icon: '🤝',
    title: 'Book a Consultant',
    description: 'Speak 1-on-1 with a property investment consultant for expert advice.',
    modalTitle: 'Book a Consultant',
    modalDescription: 'Our consultants offer free 30-minute sessions to help you make the right investment.',
  },
] as const;

export default function ContactActions() {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const active = ACTIONS.find((a) => a.key === openModal);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => setOpenModal(action.key)}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#CC1414'; el.style.boxShadow = '0 4px 16px rgba(204,20,20,0.12)'; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#E5E7EB'; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{action.icon}</div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1E1E1E', marginBottom: '0.4rem' }}>{action.title}</h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '0.75rem' }}>{action.description}</p>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CC1414', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              {action.title} →
            </span>
          </button>
        ))}
      </div>

      {active && (
        <RequestModal
          isOpen={true}
          onClose={() => setOpenModal(null)}
          requestType={active.key}
          title={active.modalTitle}
          description={active.modalDescription}
        />
      )}
    </>
  );
}
