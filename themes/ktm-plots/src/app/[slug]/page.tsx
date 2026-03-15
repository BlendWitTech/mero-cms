import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/cms';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.content.slice(0, 150).replace(/<[^>]+>/g, '') + '...',
  };
}

export default async function GenericPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div style={{ paddingBottom: '5rem', background: '#F8F9FA' }}>
      {/* Header */}
      <div style={{ background: '#CC1414', color: '#fff', padding: '5rem 0 3rem', textAlign: 'center' }}>
        <div className="container">
          <h1 className="section-title" style={{ color: '#fff', marginBottom: '0.5rem' }}>{page.title}</h1>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
            Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '4rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <article
            className="prose"
            style={{
              background: '#fff',
              padding: 'clamp(2rem, 5vw, 4rem)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              lineHeight: 1.8,
              color: '#4B5563',
              fontSize: '1.05rem',
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    </div>
  );
}
