import type { Metadata } from 'next';
import { getSiteData } from '@/lib/cms';
import Services from '@/components/sections/Services';
import Testimonials from '@/components/sections/Testimonials';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about KTM Plots — our story, mission, and the team behind Kathmandu Valley\'s trusted land partner.',
};

const team = [
  { name: 'Rajesh Gurung', role: 'CEO & Founder', bio: '15+ years in Nepali real estate. Expert in land law and property valuation.', initials: 'RG' },
  { name: 'Sushila Karki', role: 'Head of Legal', bio: 'Specialises in land title verification, registration, and property dispute resolution.', initials: 'SK' },
  { name: 'Bikram Thapa', role: 'Senior Property Consultant', bio: 'Deep knowledge of growth corridors across Kathmandu, Lalitpur, and Bhaktapur.', initials: 'BT' },
  { name: 'Anita Shrestha', role: 'Customer Relations', bio: 'Dedicated to providing a smooth experience from inquiry to final handover.', initials: 'AS' },
];

export default async function AboutPage() {
  const siteData = await getSiteData();

  return (
    <>
      {/* Page header */}
      <div style={{ background: '#1E1E1E', padding: '4rem 0 3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Red left accent — brand marker */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#CC1414' }} />
        <div className="container">
          <div className="tag-label">About Us</div>
          <h1 style={{ color: '#FFFFFF', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Kathmandu Valley&apos;s<br />Trusted Land Partner
          </h1>
          <p style={{ color: '#A0A0A0', maxWidth: '560px', lineHeight: 1.7 }}>
            Over a decade of helping families and investors secure their perfect plot in Nepal with transparency, legality, and care.
          </p>
        </div>
      </div>

      {/* Story section */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            <div>
              <h2 className="section-title">Our Story</h2>
              <p style={{ color: '#4B5563', lineHeight: 1.8, marginBottom: '1rem' }}>
                KTM Plots was founded with a simple belief: buying land in Nepal should be transparent, legal, and accessible to everyone — not just those with connections.
              </p>
              <p style={{ color: '#4B5563', lineHeight: 1.8, marginBottom: '1rem' }}>
                We started with a small team of property consultants and legal experts operating out of Kathmandu, and have grown to serve clients across Nepal and internationally, including NRNs who wish to invest in the Valley from abroad.
              </p>
              <p style={{ color: '#4B5563', lineHeight: 1.8 }}>
                Today, KTM Plots manages over 50 active plot locations across Kathmandu, Lalitpur, and Bhaktapur, with a reputation built entirely on trust, verified titles, and honest dealing.
              </p>
            </div>

            {/* Mission / Values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { title: 'Our Mission', text: 'To make land ownership simple, transparent, and accessible for every Nepali family and investor.', color: '#CC1414' },
                { title: 'Our Vision', text: 'A Nepal where every land transaction is backed by verified titles, fair prices, and professional guidance.', color: '#CC1414' },
                { title: 'Our Values', text: 'Transparency · Integrity · Legal Compliance · Customer First · Community Growth', color: '#A01010' },
              ].map((v) => (
                <div key={v.title} style={{ background: '#F4F4F4', borderRadius: '10px', padding: '1.5rem', borderLeft: `4px solid ${v.color}` }}>
                  <h4 style={{ fontWeight: 700, color: v.color, marginBottom: '0.5rem' }}>{v.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.7 }}>{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#CC1414', padding: '4rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[
              { value: '500+', label: 'Plots Sold' },
              { value: '50+', label: 'Locations' },
              { value: '10+', label: 'Years Experience' },
              { value: '100%', label: 'Legal Titles' },
              { value: '1000+', label: 'Happy Clients' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.25rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '5rem 0', background: '#F4F4F4' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Meet Our Team</h2>
            <p className="section-subtitle">The experts dedicated to finding you the perfect plot</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {team.map((member) => (
              <div key={member.name} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#2E2E2E', color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  {member.initials}
                </div>
                <h4 style={{ fontWeight: 700, color: '#1E1E1E', marginBottom: '0.25rem' }}>{member.name}</h4>
                <div style={{ fontSize: '0.8rem', color: '#CC1414', fontWeight: 600, marginBottom: '0.75rem' }}>{member.role}</div>
                <p style={{ fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.6 }}>{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services section */}
      <Services services={siteData.services} />

      {/* CTA */}
      <section style={{ padding: '4rem 0', background: '#FFFFFF', textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Ready to Find Your Plot?</h2>
          <p style={{ color: '#6B7280', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
            Browse our available plots or get in touch with our team for a free consultation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/plots" className="btn-primary">Browse Plots</Link>
            <Link href="/contact" className="btn-green">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
