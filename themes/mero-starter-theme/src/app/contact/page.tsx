import type { Metadata } from 'next';
import { getSiteData } from '@/lib/cms';
import ContactForm from '@/components/sections/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Mero CMS team. We\'d love to hear about your project.',
};

export default async function ContactPage() {
  const siteData = await getSiteData(3600).catch(() => null);
  const settings = siteData?.settings;

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ padding: '5rem 0 3rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <span className="section-label">Get in Touch</span>
          <h1 className="section-title">Let's Build Something Together</h1>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Have a question or want to talk about your project? Drop us a message.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '4rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {/* Contact info */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-text)', marginBottom: '1.5rem' }}>
              Contact Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {settings?.contactEmail && (
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--color-accent-glow)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-accent)', fontSize: '0.875rem' }}>@</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Email</div>
                    <a href={`mailto:${settings.contactEmail}`} style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>{settings.contactEmail}</a>
                  </div>
                </div>
              )}
              {settings?.contactPhone && (
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--color-accent-glow)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-accent)', fontSize: '0.875rem' }}>☎</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Phone</div>
                    <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>{settings.contactPhone}</span>
                  </div>
                </div>
              )}
              {settings?.address && (
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--color-accent-glow)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-accent)', fontSize: '0.875rem' }}>◎</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Address</div>
                    <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>{settings.address}</span>
                  </div>
                </div>
              )}

              {/* Fallback if no settings */}
              {!settings?.contactEmail && !settings?.contactPhone && (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.7 }}>
                  Fill out the form and we'll get back to you as soon as possible.
                </p>
              )}
            </div>

            {/* Why choose us */}
            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '1rem' }}>Why teams choose Mero CMS</h3>
              {['Open source, MIT licensed', 'Modular — no bloat', 'TypeScript throughout', 'Active development'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.625rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                  <span style={{ color: 'var(--color-success)' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-text)', marginBottom: '1.5rem' }}>
              Send a Message
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
