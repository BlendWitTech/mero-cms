import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPlotBySlug, getImageUrl } from '@/lib/cms';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const plot = await getPlotBySlug(slug);
  if (!plot) return { title: 'Plot Not Found' };
  return {
    title: plot.title,
    description: plot.description || undefined,
  };
}

export default async function PlotDetailPage({ params }: Props) {
  const { slug } = await params;
  const plot = await getPlotBySlug(slug);
  if (!plot) notFound();

  const imgUrl = getImageUrl(plot.featuredImageUrl);
  const status = plot.status?.toLowerCase() ?? 'available';

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ background: '#CC1414', padding: '1.5rem 0' }}>
        <div className="container" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.825rem', color: '#A0A0A0' }}>
          <Link href="/" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/plots" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Plots</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>{plot.title}</span>
        </div>
      </div>

      <section style={{ padding: '3rem 0 5rem', background: '#F4F4F4' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>
            {/* Left: Images + description */}
            <div>
              {/* Main image */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', background: '#A01010', aspectRatio: '16/9', position: 'relative' }}>
                {imgUrl ? (
                  <Image src={imgUrl} alt={plot.title} fill style={{ objectFit: 'cover' }} priority />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
                    <svg width="64" height="64" fill="none" stroke="#E82020" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Additional images */}
              {plot.images && plot.images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                  {plot.images.slice(0, 6).map((img, i) => {
                    const url = getImageUrl(img);
                    return url ? (
                      <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', position: 'relative', background: '#A01010' }}>
                        <Image src={url} alt={`${plot.title} ${i + 2}`} fill style={{ objectFit: 'cover' }} />
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Content */}
              {plot.content && (
                <div
                  className="prose"
                  style={{ color: '#374151' }}
                  dangerouslySetInnerHTML={{ __html: plot.content.replace(/\n/g, '<br/>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/# (.*)/g, '<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              )}
            </div>

            {/* Right: Details panel */}
            <div style={{ position: 'sticky', top: '5rem' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                {/* Status */}
                <div style={{ marginBottom: '1rem' }}>
                  {status === 'sold' ? <span className="badge-sold">Sold Out</span>
                    : status === 'limited' ? <span className="badge-limited">Limited Availability</span>
                    : <span className="badge-available">Available Now</span>}
                  {plot.category && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6B7280', background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {plot.category.name}
                    </span>
                  )}
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#CC1414', marginBottom: '0.75rem', lineHeight: 1.3 }}>{plot.title}</h1>

                {plot.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {plot.location}
                  </div>
                )}

                {/* Key details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {plot.priceFrom && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#FEF9EC', borderRadius: '8px', border: '1px solid #E82020' }}>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Starting Price</span>
                      <span style={{ fontWeight: 800, color: '#CC1414', fontSize: '1.1rem' }}>
                        NPR {Number(plot.priceFrom).toLocaleString('en-NP')}
                      </span>
                    </div>
                  )}
                  {plot.areaFrom && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Plot Size</span>
                      <span style={{ fontWeight: 700, color: '#065F46', fontSize: '0.95rem' }}>
                        {plot.areaFrom}{plot.areaTo && plot.areaTo !== plot.areaFrom ? ` – ${plot.areaTo}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {status !== 'sold' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Link href={`/contact?plot=${plot.slug}`} className="btn-primary" style={{ textAlign: 'center' }}>
                      Enquire About This Plot
                    </Link>
                    <Link href="/contact" className="btn-green" style={{ textAlign: 'center' }}>
                      Schedule a Site Visit
                    </Link>
                  </div>
                )}
              </div>

              {/* Why buy with us */}
              <div style={{ background: '#CC1414', borderRadius: '12px', padding: '1.5rem', color: '#FFFFFF' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: '#CC1414' }}>Why Buy With KTM Plots?</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {['Verified legal title (Lalpurja)', 'No hidden charges', 'Full registration support', 'Site visit arranged free', 'Dedicated advisor assigned'].map((item) => (
                    <li key={item} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#A0A0A0' }}>
                      <svg width="16" height="16" fill="none" stroke="#E82020" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '1px' }} viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
