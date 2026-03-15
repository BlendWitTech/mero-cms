import type { Metadata } from 'next';
import Image from 'next/image';
import { getSiteData, getImageUrl, getSection, type PageRecord } from '@/lib/cms';
import Services from '@/components/sections/Services';
import AnimatedStatsStrip from '@/components/ui/AnimatedStatsStrip';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description: "Learn about KTM Plots — our story, mission, and the team behind Kathmandu Valley's trusted land partner.",
};

// Fallback team if CMS team module is not enabled or empty
const FALLBACK_TEAM = [
  { name: 'Rajesh Gurung',  role: 'CEO & Founder',             bio: '15+ years in Nepali real estate. Expert in land law and property valuation.', image: null },
  { name: 'Sushila Karki',  role: 'Head of Legal',             bio: 'Specialises in land title verification, registration, and property dispute resolution.', image: null },
  { name: 'Bikram Thapa',   role: 'Senior Property Consultant', bio: 'Deep knowledge of growth corridors across Kathmandu, Lalitpur, and Bhaktapur.', image: null },
  { name: 'Anita Shrestha', role: 'Customer Relations',         bio: 'Dedicated to providing a smooth experience from inquiry to final handover.', image: null },
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default async function AboutPage() {
  const siteData = await getSiteData();
  const pages    = (siteData as any).pages as PageRecord[] ?? [];

  // CMS team — falls back to hardcoded if not seeded
  const cmsTeam: any[] = (siteData as any).team ?? [];
  const teamList = cmsTeam.length > 0 ? cmsTeam : FALLBACK_TEAM;

  // About page section overrides
  const heroSec  = getSection(pages, 'about', 'hero');
  const heroTitle    = heroSec.data.title    || "Kathmandu Valley's Trusted Land Partner";
  const heroSubtitle = heroSec.data.subtitle || 'Over a decade of helping families and investors secure their perfect plot in Nepal with transparency, legality, and care.';
  const heroBgUrl    = heroSec.data.bgImage  ? getImageUrl(heroSec.data.bgImage) : null;

  const ctaSec   = getSection(pages, 'about', 'cta');
  const ctaTitle = ctaSec.data.title || 'Ready to Find Your Plot?';
  const ctaBtn   = ctaSec.data.button as { text?: string; url?: string } | undefined;

  const storySec = getSection(pages, 'about', 'story');
  const storyTitle   = storySec.data.title   || 'Our Story';
  const storyContent = storySec.data.content || null;
  const storyImage   = storySec.data.image   ? getImageUrl(storySec.data.image) : null;
  const valueCards = [
    { title: storySec.data.card1Title || 'Our Mission', text: storySec.data.card1Text || 'To make land ownership simple, transparent, and accessible for every Nepali family and investor.' },
    { title: storySec.data.card2Title || 'Our Vision',  text: storySec.data.card2Text || 'A Nepal where every land transaction is backed by verified titles, fair prices, and professional guidance.' },
    { title: storySec.data.card3Title || 'Our Values',  text: storySec.data.card3Text || 'Transparency · Integrity · Legal Compliance · Customer First · Community Growth' },
  ];

  const teamSec     = getSection(pages, 'about', 'team');
  const teamTitle   = teamSec.data.title    || 'Meet Our Team';
  const teamSubtitle = teamSec.data.subtitle || 'The experts dedicated to finding you the perfect plot';

  // Stats from page sections or fallback
  const statsSec = getSection(pages, 'about', 'stats');
  const stats: Array<{ value: string; label: string }> = statsSec.data.items || [
    { value: '500+',  label: 'Plots Sold' },
    { value: '50+',   label: 'Locations' },
    { value: '10+',   label: 'Years Experience' },
    { value: '100%',  label: 'Legal Titles' },
    { value: '1000+', label: 'Happy Clients' },
  ];

  return (
    <>
      {/* Page hero */}
      <div className="page-hero-band" style={{ background: '#1E1E1E', padding: '4rem 0 3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: '#CC1414' }} />
        {heroBgUrl ? (
          <>
            <Image src={heroBgUrl} alt="About hero background" fill style={{ objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.55) 100%)' }} />
          </>
        ) : (
          <div className="about-hero-panel" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', background: 'linear-gradient(155deg,#CC1414,#8B0000)', clipPath: 'polygon(20% 0,100% 0,100% 100%,0% 100%)', opacity: 0.85 }} />
        )}
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="tag-label animate-slide-right">About Us</div>
          <h1 className="animate-slide-up delay-100" style={{ color: '#FFFFFF', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '1rem', maxWidth: '620px' }}>
            {heroTitle}
          </h1>
          <p className="animate-slide-up delay-200" style={{ color: '#A0A0A0', maxWidth: '540px', lineHeight: 1.75 }}>
            {heroSubtitle}
          </p>
        </div>
      </div>

      {/* Story section */}
      <section style={{ padding: '5rem 0', background: '#FFFFFF' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'start' }}>
            <div>
              <h2 className="section-title">{storyTitle}</h2>
              {storyContent ? (
                <div className="prose" dangerouslySetInnerHTML={{ __html: storyContent }} />
              ) : (
                <>
                  <p style={{ color: '#4B5563', lineHeight: 1.8, marginBottom: '1rem' }}>
                    KTM Plots was founded with a simple belief: buying land in Nepal should be transparent, legal, and accessible to everyone — not just those with connections.
                  </p>
                  <p style={{ color: '#4B5563', lineHeight: 1.8, marginBottom: '1rem' }}>
                    We started with a small team of property consultants and legal experts in Kathmandu, and have grown to serve clients across Nepal and internationally, including NRNs investing from abroad.
                  </p>
                  <p style={{ color: '#4B5563', lineHeight: 1.8 }}>
                    Today, KTM Plots manages over 50 active plot locations across Kathmandu, Lalitpur, and Bhaktapur, with a reputation built entirely on trust, verified titles, and honest dealing.
                  </p>
                </>
              )}
            </div>

            {/* Story image OR Mission/Values */}
            {storyImage ? (
              <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
                <Image src={storyImage} alt="About KTM Plots" fill style={{ objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {valueCards.map((v) => (
                  <div key={v.title} style={{ background: '#F4F4F4', borderRadius: '10px', padding: '1.5rem', borderLeft: '4px solid #CC1414' }}>
                    <h4 style={{ fontWeight: 700, color: '#CC1414', marginBottom: '0.5rem' }}>{v.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.7 }}>{v.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats — CMS driven, animated on scroll */}
      <AnimatedStatsStrip stats={stats} />

      {/* Team — from CMS TeamMember records */}
      <section style={{ padding: '5rem 0', background: '#F4F4F4' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="tag-label">Our People</div>
            <h2 className="section-title">{teamTitle}</h2>
            <p className="section-subtitle">{teamSubtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {teamList.map((member: any, idx: number) => {
              const photoUrl = member.image ? getImageUrl(member.image) : null;
              return (
                <div key={member.name} className={`animate-slide-up delay-${Math.min(idx * 100, 400)}`} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderTop: '3px solid #CC1414' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1E1E1E', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', position: 'relative', flexShrink: 0 }}>
                    {photoUrl ? (
                      <Image src={photoUrl} alt={member.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800 }}>{initials(member.name)}</span>
                    )}
                  </div>
                  <h4 style={{ fontWeight: 700, color: '#1E1E1E', marginBottom: '0.25rem' }}>{member.name}</h4>
                  <div style={{ fontSize: '0.78rem', color: '#CC1414', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</div>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: 1.65 }}>{member.bio}</p>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
            Manage team members in <strong>Admin → Content → Team</strong>
          </p>
        </div>
      </section>

      {/* Services */}
      <Services services={siteData.services} />

      {/* CTA */}
      <section style={{ padding: '4rem 0', background: '#FFFFFF', textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>{ctaTitle}</h2>
          <p style={{ color: '#6B7280', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
            Browse our available plots or get in touch with our team for a free consultation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href={ctaBtn?.url || '/plots'} className="btn-primary">{ctaBtn?.text || 'Browse Plots'}</Link>
            <Link href="/contact" className="btn-green">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
