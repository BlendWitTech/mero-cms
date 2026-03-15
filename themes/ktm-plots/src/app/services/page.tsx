import Link from 'next/link';
import { getSiteData } from '@/lib/cms';

export const metadata = { title: 'Our Services | KTM Plots' };

const ALL_SERVICES = [
  {
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: 'Land Plot Sales',
    subtitle: 'Residential · Commercial · Agricultural',
    description: 'We offer verified, legally-clear plots across Kathmandu, Lalitpur, Bhaktapur, and surrounding districts. All plots come with title-verified Lalpurja and are registered with the Land Revenue Office.',
    steps: ['Site selection & shortlisting', 'Legal title verification', 'Price negotiation support', 'Registration at Land Revenue Office'],
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Legal Documentation',
    subtitle: 'Title Verification · Ownership Transfer',
    description: 'Our legal team handles all paperwork from due diligence and Lalpurja checks to the final deed transfer at the Land Revenue Office. We ensure zero legal complications post-purchase.',
    steps: ['Lalpurja & 4-killa verification', 'Encumbrance & ownership check', 'Deed preparation & review', 'Registration & transfer'],
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: 'Site Visit Arrangement',
    subtitle: 'Guided Visits · Expert Tours',
    description: 'Before you decide, see the plot in person. We arrange private, guided site visits with our property experts who walk you through the plot boundaries, access roads, utilities, and surroundings.',
    steps: ['Schedule a visit at your convenience', 'Expert guide accompanies you', 'Boundary & access walkthrough', 'Post-visit Q&A session'],
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    title: 'Investment Consulting',
    subtitle: 'Market Trends · ROI Analysis',
    description: 'Not sure which zone offers the best return? Our consultants analyse price trends, infrastructure development plans, and growth corridors to help you invest with confidence.',
    steps: ['Market trend analysis', 'Zone & corridor evaluation', 'Investment return projections', 'Personalised portfolio advice'],
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Construction Referral',
    subtitle: 'Architects · Contractors · Engineers',
    description: 'Once you own the land, we connect you with trusted architects, engineers, and contractors from our vetted partner network to bring your dream home to life.',
    steps: ['Match with suitable professionals', 'Design consultation', 'Building permit assistance', 'Construction supervision referral'],
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
    title: 'After-Sales Support',
    subtitle: 'Post-Registration · Utilities',
    description: 'Our relationship doesn\'t end at registration. We help you navigate utilities connection, local ward office requirements, and any follow-up documentation needed after the sale.',
    steps: ['Electricity & water connection guidance', 'Ward office formalities', 'Boundary wall & access permit', 'Ongoing advisory support'],
  },
];

export default async function ServicesPage() {
  const siteData = await getSiteData();
  const { settings } = siteData;

  // Merge CMS services with the defaults (CMS takes priority if they exist)
  const cmsServices = siteData.services;

  return (
    <>
      {/* Hero */}
      <section className="page-hero-band" style={{ background: '#1E1E1E', padding: '5rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#CC1414' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', background: 'rgba(204,20,20,0.15)', border: '1px solid rgba(204,20,20,0.4)', color: '#FF6B6B', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.35rem 1rem', borderRadius: '4px', marginBottom: '1.25rem' }}>
            What We Offer
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem', lineHeight: 1.15 }}>
            Full-Service Land <span style={{ color: '#CC1414' }}>Solutions</span>
          </h1>
          <p style={{ color: '#A0A0A0', fontSize: '1.1rem', maxWidth: '560px', lineHeight: 1.75 }}>
            From your first inquiry to registration and beyond — we guide you through every step of buying land in Nepal.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section style={{ padding: '5rem 0', background: '#F4F4F4' }}>
        <div className="container">
          <div className="services-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '2rem' }}>
            {(cmsServices.length > 0 ? cmsServices.map((s: any, i) => ({
              icon: ALL_SERVICES[i % ALL_SERVICES.length]?.icon,
              title: s.title,
              subtitle: s.subtitle || '',
              description: s.description,
              steps: Array.isArray(s.processSteps) ? s.processSteps : [],
            })) : ALL_SERVICES).map((service, i) => (
              <div
                key={i}
                style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}
              >
                {/* Card header */}
                <div style={{ background: '#CC1414', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ color: '#fff', flexShrink: 0 }}>{service.icon}</div>
                  <div>
                    <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{service.title}</h3>
                    {service.subtitle && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em' }}>{service.subtitle}</p>}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '1.75rem 2rem', flex: 1 }}>
                  <p style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: service.steps.length > 0 ? '1.5rem' : 0 }}>
                    {service.description}
                  </p>
                  {service.steps.length > 0 && (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {service.steps.map((step: string, j: number) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: '#374151' }}>
                          <span style={{ width: '20px', height: '20px', background: '#FEE2E2', color: '#CC1414', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>{j + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ background: '#1E1E1E', borderRadius: '16px', padding: 'clamp(2.5rem, 5vw, 4rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#CC1414' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem' }}>
                Ready to Get Started?
              </h2>
              <p style={{ color: '#A0A0A0', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
                {settings.tagline || 'Speak with one of our property consultants for a free consultation — no commitments required.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
                  Book a Free Consultation
                </Link>
                <Link href="/plots" className="btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
                  Browse Plots
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
