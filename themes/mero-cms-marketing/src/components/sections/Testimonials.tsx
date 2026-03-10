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
        <span key={i} style={{ opacity: i < rating ? 1 : 0.2 }}>★</span>
      ))}
    </div>
  );
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const list = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

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

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {list.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {t.rating && <StarRating rating={t.rating} />}

              <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>
                "{t.content}"
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                {/* Avatar */}
                {t.clientPhoto ? (
                  <img
                    src={t.clientPhoto}
                    alt={t.clientName}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {t.clientName[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                    {t.clientName}
                  </div>
                  {(t.clientRole || t.clientCompany) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-2)' }}>
                      {t.clientRole}{t.clientRole && t.clientCompany ? ' · ' : ''}{t.clientCompany}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
