export default function Hero() {
  return (
    <section style={{
      padding: '7rem 0 5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '600px',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative' }}>
        {/* Eyebrow badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <span className="badge badge-accent">✦ Open Source · Self-Hosted · Module-First</span>
        </div>

        {/* Headline */}
        <h1 style={{
          textAlign: 'center',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          marginBottom: '1.75rem',
          maxWidth: '900px',
          margin: '0 auto 1.75rem',
        }}>
          The CMS That{' '}
          <span style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Adapts to You
          </span>
        </h1>

        {/* Sub */}
        <p style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          color: 'var(--color-muted)',
          maxWidth: '580px',
          margin: '0 auto 2.75rem',
          lineHeight: 1.7,
        }}>
          Select only the modules you need, install a theme, and go live.
          One backend powers every project — no bloat, no limits.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '5rem' }}>
          <a href="/contact" className="btn btn-primary btn-lg">
            Get Started Free
          </a>
          <a href="/#features" className="btn btn-outline btn-lg">
            See Features
          </a>
        </div>

        {/* Dashboard mockup */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
          background: 'var(--color-surface)',
        }}>
          {/* Window chrome */}
          <div style={{
            background: 'var(--color-surface-2)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0.875rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', opacity: 0.7 }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', opacity: 0.7 }} />
            <div style={{ flex: 1, background: 'var(--color-border)', borderRadius: '4px', height: '22px', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', paddingLeft: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-2)' }}>localhost:3000/dashboard</span>
            </div>
          </div>

          {/* Admin UI mockup */}
          <div style={{ display: 'flex', height: '360px' }}>
            {/* Sidebar */}
            <div style={{ width: '200px', borderRight: '1px solid var(--color-border)', padding: '1.25rem 0', flexShrink: 0 }}>
              {[
                { icon: '⬡', label: 'Dashboard', active: true },
                { icon: '✏', label: 'Blog' },
                { icon: '◈', label: 'Portfolio' },
                { icon: '◎', label: 'Services' },
                { icon: '✦', label: 'Team' },
                { icon: '◇', label: 'Leads' },
                { icon: '⚙', label: 'Settings' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.8rem',
                  color: item.active ? 'var(--color-text)' : 'var(--color-muted)',
                  background: item.active ? 'var(--color-accent-glow)' : 'transparent',
                  borderRight: item.active ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}>
                  <span style={{ opacity: 0.7 }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-2)', marginBottom: '1.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Dashboard Overview
              </div>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Blog Posts', value: '42', delta: '+3 this week' },
                  { label: 'New Leads', value: '18', delta: '+5 today' },
                  { label: 'Page Views', value: '9.2k', delta: '+12% this month' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', padding: '0.875rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-muted-2)', marginBottom: '0.25rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-success)', marginTop: '0.2rem' }}>{stat.delta}</div>
                  </div>
                ))}
              </div>
              {/* Recent items */}
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {['Getting Started with Mero CMS', 'How to Build a Theme', 'Module System Overview'].map((title, i) => (
                  <div key={title} style={{
                    padding: '0.625rem 1rem',
                    borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                    {title}
                    <span style={{ marginLeft: 'auto', color: 'var(--color-muted-2)', fontSize: '0.65rem' }}>Published</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          {['Open Source', 'Self-Hosted', 'TypeScript', 'NestJS + Next.js', 'PostgreSQL'].map(label => (
            <span key={label} style={{ fontSize: '0.8rem', color: 'var(--color-muted-2)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ color: 'var(--color-success)' }}>✓</span> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
