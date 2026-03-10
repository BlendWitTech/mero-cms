import Image from 'next/image';
import type { Testimonial } from '@/lib/cms';
import { getImageUrl } from '@/lib/cms';

interface Props {
  testimonials: Testimonial[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" fill={i < rating ? '#D4A017' : '#E5E7EB'} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({ testimonials }: Props) {
  const list = testimonials.length > 0 ? testimonials : [];
  if (list.length === 0) return null;

  return (
    <section style={{ padding: '5rem 0', background: '#1B4332' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ color: '#D4A017', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Client Stories
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            What Our Clients Say
          </h2>
          <p style={{ color: '#B7D9C8', fontSize: '1rem', maxWidth: '480px', margin: '0 auto' }}>
            Hear directly from families and investors who found their perfect plot with KTM Plots.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {list.map((t) => {
            const avatarUrl = getImageUrl(t.avatarUrl);
            const initials = t.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={t.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1.75rem',
                }}
              >
                {/* Quote icon */}
                <svg width="28" height="28" fill="#D4A017" opacity="0.4" viewBox="0 0 24 24" style={{ marginBottom: '1rem' }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>

                {t.rating && <Stars rating={t.rating} />}

                <p style={{ color: '#D1FAE5', fontSize: '0.9rem', lineHeight: 1.8, margin: '1rem 0 1.25rem', fontStyle: 'italic' }}>
                  &ldquo;{t.content}&rdquo;
                </p>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#2D6A4F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={t.name} width={42} height={42} style={{ objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#D4A017', fontWeight: 700, fontSize: '0.85rem' }}>{initials}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                    {t.role && <div style={{ color: '#B7D9C8', fontSize: '0.78rem' }}>{t.role}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
