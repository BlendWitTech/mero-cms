import Link from 'next/link';
import Image from 'next/image';
import type { SiteData } from '@/lib/cms';
import { getImageUrl } from '@/lib/cms';

interface Props {
  siteData: SiteData;
  secData?: Record<string, any>;
}

export default function About({ siteData, secData = {} }: Props) {
  const { settings } = siteData;

  const title = secData.title || settings.aboutTitle || "Kathmandu Valley's Most Trusted Land Partner";
  const content = secData.content || settings.aboutContent || 'Founded with a vision to make land ownership accessible and transparent, KTM Plots has helped over 500 families and investors secure their piece of the Kathmandu Valley. We specialise in residential, commercial, and agricultural plots across Kathmandu, Lalitpur, Bhaktapur, and surrounding districts.';
  const aboutImageUrl = getImageUrl(secData.image || settings.aboutImage);
  const sectionLabel = secData.label || 'About KTM Plots';
  const secondaryContent = secData.secondaryContent || 'Our team of legal experts, property consultants, and local specialists ensures that every transaction is smooth, secure, and stress-free — from your first site visit to the final registration at the Land Revenue Office.';
  const buttonText = secData.buttonText || 'Learn More About Us';
  const buttonUrl = secData.buttonUrl || '/about';

  const features = [
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      title: 'Verified Legal Titles',
      desc: 'Every plot we sell comes with a verified Lalpurja and clean ownership record.',
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
        </svg>
      ),
      title: '10+ Years Experience',
      desc: 'Over a decade of helping families and investors find the right land in Nepal.',
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Dedicated Support',
      desc: 'A personal property advisor guides you from first inquiry to final registration.',
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      title: 'Transparent Pricing',
      desc: 'No hidden fees. All prices are published and include applicable government taxes.',
    },
  ];

  return (
    <section id="about" style={{ padding: '5rem 0', background: '#F4F4F4' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          {/* Text content */}
          <div>
            <div style={{ color: '#CC1414', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              {sectionLabel}
            </div>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {title}
            </h2>
            <p style={{ color: '#4B5563', marginBottom: '1.5rem', lineHeight: 1.8 }}>
              {content}
            </p>
            <p style={{ color: '#4B5563', marginBottom: '2rem', lineHeight: 1.8 }}>
              {secondaryContent}
            </p>
            <Link href={buttonUrl} className="btn-green">
              {buttonText}
            </Link>
          </div>

          {/* Image or feature grid */}
          {aboutImageUrl ? (
            <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '4/3', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
              <Image src={aboutImageUrl} alt="About KTM Plots" fill style={{ objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {features.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    borderTop: '3px solid #CC1414',
                  }}
                >
                  <div style={{ color: '#CC1414', marginBottom: '0.75rem' }}>{f.icon}</div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', color: '#1E1E1E' }}>{f.title}</h4>
                  <p style={{ fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
