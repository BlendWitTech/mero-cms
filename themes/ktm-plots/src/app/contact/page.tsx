import type { Metadata } from 'next';
import { getSiteData } from '@/lib/cms';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with KTM Plots for a free consultation, site visit, or property inquiry.',
};

export default async function ContactPage() {
  const siteData = await getSiteData();
  const { settings } = siteData;

  const contactItems = [
    ...(settings.address ? [{ icon: 'location', label: 'Address', value: settings.address, href: null }] : []),
    ...(settings.contactPhone ? [{ icon: 'phone', label: 'Phone', value: settings.contactPhone, href: `tel:${settings.contactPhone}` }] : []),
    ...(settings.contactEmail ? [{ icon: 'email', label: 'Email', value: settings.contactEmail, href: `mailto:${settings.contactEmail}` }] : []),
  ];

  return (
    <>
      {/* Header */}
      <div style={{ background: '#1E1E1E', padding: '4rem 0 3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Red left accent — brand marker */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#CC1414' }} />
        <div className="container">
          <div className="tag-label">Get In Touch</div>
          <h1 style={{ color: '#FFFFFF', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '1rem' }}>Contact Us</h1>
          <p style={{ color: '#A0A0A0', maxWidth: '480px', lineHeight: 1.7 }}>
            Have a question about a plot or want to schedule a free site visit? Our team is ready to help.
          </p>
        </div>
      </div>

      <section style={{ padding: '4rem 0 5rem', background: '#F4F4F4' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            {/* Contact info */}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E1E1E', marginBottom: '1.5rem' }}>We&apos;d Love to Hear from You</h2>
              <p style={{ color: '#4B5563', lineHeight: 1.8, marginBottom: '2rem' }}>
                Whether you&apos;re a first-time buyer, an experienced investor, or an NRN looking to invest in Nepal — our team is here to guide you every step of the way.
              </p>

              {contactItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                  {contactItems.map((item) => (
                    <div key={item.label} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '42px', height: '42px', background: '#CC1414', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.icon === 'location' && (
                          <svg width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        )}
                        {item.icon === 'phone' && (
                          <svg width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        )}
                        {item.icon === 'email' && (
                          <svg width="18" height="18" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{item.label}</div>
                        {item.href ? (
                          <a href={item.href} style={{ color: '#CC1414', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>{item.value}</a>
                        ) : (
                          <span style={{ color: '#CC1414', fontWeight: 600, fontSize: '0.95rem' }}>{item.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Office hours */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                <h4 style={{ fontWeight: 700, color: '#CC1414', marginBottom: '1rem' }}>Office Hours</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#4B5563' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sunday – Friday</span><span style={{ fontWeight: 600 }}>9:00 AM – 6:00 PM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Saturday</span><span style={{ fontWeight: 600 }}>10:00 AM – 4:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
