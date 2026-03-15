const STEPS = [
  {
    number: '01',
    title: 'Deploy the Backend',
    description: 'Clone the repo, add your database URL, and run the NestJS backend. One command — the API is live.',
    detail: 'npm install && npm run start',
  },
  {
    number: '02',
    title: 'Run the Setup Wizard',
    description: 'Open the admin frontend. A setup wizard guides you through creating your admin account and selecting exactly which modules to enable.',
    detail: 'Blog ✓  Portfolio ✓  Team ✓  Leads ✓',
  },
  {
    number: '03',
    title: 'Install or Build a Theme',
    description: 'Upload a Next.js theme ZIP from the Themes page. The CMS seeds initial content, activates the theme, and you point it to your frontend deploy URL.',
    detail: 'Upload → Seed → Activate',
  },
  {
    number: '04',
    title: 'Go Live',
    description: 'Your frontend theme fetches all content from the public API. Edit anything in the admin and changes appear instantly — no redeploy needed.',
    detail: 'CMS API → Theme → Users',
  },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header section-header--center">
          <span className="section-label">The Process</span>
          <h2 className="section-title">Up and Running in Minutes</h2>
          <p className="section-subtitle">
            No complex configuration. No vendor lock-in. A clear path from zero to a fully managed website.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          position: 'relative',
        }}>
          {STEPS.map((step, idx) => (
            <div key={step.number} style={{ position: 'relative' }}>
              {/* Connector line (not last) */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  display: 'none', // shown on larger screens via media query workaround
                }} />
              )}

              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem 1.5rem',
                height: '100%',
                transition: 'border-color 0.2s',
              }}>
                {/* Step number */}
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  color: 'transparent',
                  WebkitTextStroke: '2px var(--color-border-light)',
                  marginBottom: '1.25rem',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {step.number}
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.625rem', color: 'var(--color-text)' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  {step.description}
                </p>

                {/* Code-like detail */}
                <div style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-accent)',
                }}>
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
