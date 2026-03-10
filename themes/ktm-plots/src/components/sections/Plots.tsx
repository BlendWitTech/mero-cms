import Link from 'next/link';
import Image from 'next/image';
import type { Project } from '@/lib/cms';
import { getImageUrl } from '@/lib/cms';

interface Props {
  plots: Project[];
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status?.toLowerCase() ?? 'available';
  if (s === 'sold') return <span className="badge-sold">Sold</span>;
  if (s === 'limited') return <span className="badge-limited">Limited</span>;
  return <span className="badge-available">Available</span>;
}

export default function Plots({ plots }: Props) {
  const list = plots.length > 0 ? plots : [];

  if (list.length === 0) {
    return (
      <section id="plots" style={{ padding: '5rem 0', background: '#F9F6F0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Featured Plots</h2>
          <p style={{ color: '#6B7280' }}>No plots available at the moment. Please check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="plots" style={{ padding: '5rem 0', background: '#F9F6F0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ color: '#D4A017', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Available Now
            </div>
            <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Featured Plots</h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Handpicked plots across the Kathmandu Valley</p>
          </div>
          <Link href="/plots" className="btn-green" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
            View All Plots →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {list.map((plot) => {
            const imgUrl = getImageUrl(plot.featuredImageUrl);
            return (
              <Link
                key={plot.id}
                href={`/plots/${plot.slug}`}
                style={{ textDecoration: 'none', display: 'block', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(27,67,50,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '200px', background: '#2D6A4F' }}>
                  {imgUrl ? (
                    <Image src={imgUrl} alt={plot.title} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="48" height="48" fill="none" stroke="#52B788" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      </svg>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <StatusBadge status={plot.status} />
                  </div>
                  {/* Category */}
                  {plot.category && (
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(27,67,50,0.85)', color: '#D4A017', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {plot.category.name}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1B4332', marginBottom: '0.4rem' }}>{plot.title}</h3>

                  {/* Location */}
                  {plot.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6B7280', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {plot.location}
                    </div>
                  )}

                  <p style={{ fontSize: '0.825rem', color: '#6B7280', marginBottom: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {plot.description}
                  </p>

                  {/* Details row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                    {plot.areaFrom && (
                      <div style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                        <span style={{ fontWeight: 600 }}>{plot.areaFrom}</span>
                        {plot.areaTo && plot.areaTo !== plot.areaFrom && ` – ${plot.areaTo}`}
                      </div>
                    )}
                    {plot.priceFrom && (
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#D4A017' }}>
                        From NPR {Number(plot.priceFrom).toLocaleString('en-NP')}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
