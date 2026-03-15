'use client';

import { useState, useEffect, useRef } from 'react';
import { Testimonial } from '@/lib/cms';

// Static fallbacks shown when CMS has no testimonials yet
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    clientName: 'Sarah Chen',
    clientRole: 'Lead Developer',
    clientCompany: 'Brightwave Agency',
    clientPhoto: null,
    content: 'Mero CMS cut our client onboarding time in half. We set up only the modules each client needs, and the theme system makes deploying a polished frontend trivial.',
    rating: 5,
    order: 1,
  },
  {
    id: '2',
    clientName: 'Marcus Okafor',
    clientRole: 'Founder',
    clientCompany: 'LaunchPad Studio',
    clientPhoto: null,
    content: 'Finally, a CMS that doesn\'t lock you into a bloated admin full of features nobody asked for. The modular setup wizard is exactly what agencies need.',
    rating: 5,
    order: 2,
  },
  {
    id: '3',
    clientName: 'Priya Nair',
    clientRole: 'CTO',
    clientCompany: 'Novus Digital',
    clientPhoto: null,
    content: 'The RBAC system and audit logs gave our enterprise clients exactly the compliance controls they needed. Highly recommend for professional deployments.',
    rating: 5,
    order: 3,
  },
];

interface TestimonialsProps {
  testimonials: Testimonial[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < rating ? 1 : 0.2, color: '#f59e0b', fontSize: '1.25rem' }}>★</span>
      ))}
    </div>
  );
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const list = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  if (list.length === 0) return null;

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const prev = () => goTo((current - 1 + list.length) % list.length);
  const next = () => goTo((current + 1) % list.length);

  // Auto-advance every 5 seconds
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (list.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % list.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [list.length]);

  const t = list[current];

  return (
    <section className="section" id="testimonials">
      <div className="container">
        <div className="section-header section-header--center">
          <span className="section-label">What People Say</span>
          <h2 className="section-title">Trusted by Developers & Agencies</h2>
          <p className="section-subtitle">
            See why teams choose Mero CMS for their clients' websites.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
          {/* Main Card */}
          <div
            className="card"
            style={{
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
              padding: 'clamp(2rem, 5vw, 3.5rem)',
              textAlign: 'center', alignItems: 'center',
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? 'scale(0.98) translateY(8px)' : 'scale(1) translateY(0)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {t.rating && <StarRating rating={t.rating} />}

            <p style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.35rem)',
              color: 'var(--color-text)',
              lineHeight: 1.7,
              fontStyle: 'italic',
              margin: '1rem 0',
              fontWeight: 500,
            }}>
              "{t.content}"
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
              {/* Avatar */}
              {t.clientPhoto ? (
                <img
                  src={t.clientPhoto}
                  alt={t.clientName}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
                />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', fontWeight: 800, color: '#fff',
                  border: '2px solid rgba(139,92,246,0.3)',
                }}>
                  {t.clientName[0]}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>
                  {t.clientName}
                </div>
                {(t.clientRole || t.clientCompany) && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                    {t.clientRole}{t.clientRole && t.clientCompany ? ' · ' : ''}
                    <span style={{ color: 'var(--color-accent)' }}>{t.clientCompany}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          {list.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                style={{
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '50%',
                  width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-muted)', transition: 'background 0.2s, color 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-accent-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>
              </button>

              {/* Dots */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {list.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    style={{
                      width: i === current ? '32px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: i === current ? 'var(--color-accent)' : 'var(--color-border)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Next testimonial"
                style={{
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '50%',
                  width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-muted)', transition: 'background 0.2s, color 0.2s, border-color 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-accent-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
