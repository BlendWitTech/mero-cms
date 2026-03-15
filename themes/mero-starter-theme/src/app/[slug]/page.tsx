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

  if (!page || page.status !== 'published') {
    notFound();
  }

  return (
    <div style={{ paddingBottom: '5rem', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ padding: '5rem 0 3rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <h1 className="section-title">{page.title}</h1>
          <p className="section-subtitle" style={{ margin: '0 auto', opacity: 0.8 }}>
            Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '4rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <article
            className="prose"
            style={{
              background: 'var(--color-surface)',
              padding: 'clamp(2rem, 5vw, 4rem)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              border: '1px solid var(--color-border)',
              lineHeight: 1.8,
              color: 'var(--color-muted)',
              fontSize: '1rem',
            }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>
    </div>
  );
}
