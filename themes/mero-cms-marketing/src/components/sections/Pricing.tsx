const FREE_FEATURES = [
  'All core modules included',
  'Unlimited users & roles',
  'Blog, Portfolio, Team, Services',
  'Lead capture & management',
  'SEO & sitemap tools',
  'Theme upload & management',
  'REST API access',
  'Community support (GitHub)',
  'MIT License — use commercially',
];

const PRO_FEATURES = [
  'Everything in Free, plus:',
  'Managed cloud hosting',
  'Automated backups',
  'Priority email support',
  'Premium themes included',
  'Uptime SLA guarantee',
  'Custom domain & SSL',
  'Analytics & reporting',
  'Onboarding call included',
];

export default function Pricing() {
  return (
    <section className="section section--alt" id="pricing">
      <div className="container">
        <div className="section-header section-header--center">
          <span className="section-label">Pricing</span>
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">
            Start for free, self-host forever. Upgrade when you want managed infrastructure and support.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          maxWidth: '780px',
          margin: '0 auto',
        }}>
          {/* Free tier */}
          <div className="card" style={{ padding: '2.25rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Free
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>$0</span>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>/ forever</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
                Self-host on your own server. Full source code. No limits.
              </p>
            </div>

            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: '2rem' }}>
              Download on GitHub
            </a>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {FREE_FEATURES.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                  <span style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro tier */}
          <div className="card card--accent" style={{ padding: '2.25rem', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
              color: '#fff', fontSize: '0.7rem', fontWeight: 700,
              padding: '0.25rem 0.875rem', borderRadius: '9999px',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Most Popular
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Pro
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>$29</span>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>/ month</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
                Fully managed hosting. We handle servers, backups, and updates.
              </p>
            </div>

            <a href="/contact" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '2rem' }}>
              Start Free Trial →
            </a>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {PRO_FEATURES.map((f, i) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: i === 0 ? 'var(--color-text)' : 'var(--color-muted)', fontWeight: i === 0 ? 600 : 400 }}>
                  {i === 0
                    ? <span style={{ flexShrink: 0, marginTop: '1px', width: '14px' }} />
                    : <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  }
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fine print */}
        <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.8rem', color: 'var(--color-muted-2)' }}>
          No credit card required for the free tier. Pro includes a 14-day free trial.
        </p>
      </div>
    </section>
  );
}
