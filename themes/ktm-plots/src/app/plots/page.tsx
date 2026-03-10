import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPlots } from '@/lib/cms';
import { getImageUrl } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Available Plots',
  description: 'Browse all available land plots across Kathmandu Valley. Verified titles, transparent pricing, and professional support.',
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status?.toLowerCase() ?? 'available';
  if (s === 'sold') return <span className="badge-sold">Sold</span>;
  if (s === 'limited') return <span className="badge-limited">Limited</span>;
  return <span className="badge-available">Available</span>;
}

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function PlotsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const category = params.category;

  const { data: plots, total } = await getPlots({ page, limit: 9, category });
  const totalPages = Math.ceil(total / 9);

  const categories = [
    { slug: '', label: 'All Plots' },
    { slug: 'residential', label: 'Residential' },
    { slug: 'commercial', label: 'Commercial' },
    { slug: 'agricultural', label: 'Agricultural' },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ background: '#1B4332', padding: '4rem 0 3rem' }}>
        <div className="container">
          <div style={{ color: '#D4A017', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Land Listings</div>
          <h1 style={{ color: '#FFFFFF', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Available Plots
          </h1>
          <p style={{ color: '#B7D9C8', maxWidth: '480px' }}>
            Browse our verified land plots across Kathmandu Valley. All with clear legal titles and professional support.
          </p>
        </div>
      </div>

      <section style={{ padding: '3rem 0 5rem', background: '#F9F6F0' }}>
        <div className="container">
          {/* Category filter */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug ? `/plots?category=${cat.slug}` : '/plots'}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: (category || '') === cat.slug ? '#1B4332' : '#FFFFFF',
                  color: (category || '') === cat.slug ? '#FFFFFF' : '#4B5563',
                  border: '1px solid',
                  borderColor: (category || '') === cat.slug ? '#1B4332' : '#E5E7EB',
                  transition: 'all 0.2s',
                }}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {plots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: '#6B7280' }}>
              <p style={{ fontSize: '1.1rem' }}>No plots found in this category.</p>
              <Link href="/plots" style={{ color: '#1B4332', fontWeight: 600, marginTop: '1rem', display: 'inline-block' }}>View all plots →</Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', color: '#6B7280', fontSize: '0.875rem' }}>
                Showing {plots.length} of {total} plots
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.75rem' }}>
                {plots.map((plot) => {
                  const imgUrl = getImageUrl(plot.featuredImageUrl);
                  return (
                    <Link
                      key={plot.id}
                      href={`/plots/${plot.slug}`}
                      style={{ textDecoration: 'none', display: 'block', background: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(27,67,50,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
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
                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}><StatusBadge status={plot.status} /></div>
                        {plot.category && (
                          <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(27,67,50,0.85)', color: '#D4A017', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {plot.category.name}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1B4332', marginBottom: '0.4rem' }}>{plot.title}</h3>
                        {plot.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#6B7280', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {plot.location}
                          </div>
                        )}
                        <p style={{ fontSize: '0.825rem', color: '#6B7280', marginBottom: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {plot.description}
                        </p>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                  {page > 1 && (
                    <Link href={`/plots?page=${page - 1}${category ? `&category=${category}` : ''}`}
                      style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', textDecoration: 'none', color: '#4B5563', fontSize: '0.875rem' }}>
                      ← Prev
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link key={p} href={`/plots?page=${p}${category ? `&category=${category}` : ''}`}
                      style={{ padding: '0.5rem 0.875rem', background: p === page ? '#1B4332' : '#FFFFFF', border: '1px solid', borderColor: p === page ? '#1B4332' : '#E5E7EB', borderRadius: '6px', textDecoration: 'none', color: p === page ? '#FFFFFF' : '#4B5563', fontSize: '0.875rem', fontWeight: p === page ? 700 : 400 }}>
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link href={`/plots?page=${page + 1}${category ? `&category=${category}` : ''}`}
                      style={{ padding: '0.5rem 1rem', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', textDecoration: 'none', color: '#4B5563', fontSize: '0.875rem' }}>
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
