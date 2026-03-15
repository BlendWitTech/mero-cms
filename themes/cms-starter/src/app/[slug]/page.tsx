import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPageBySlug } from '@/lib/cms';

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || '',
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;

  // Skip reserved slugs (handled by other routes)
  if (slug === 'blog') {
    notFound();
  }

  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-200 hover:text-white transition-colors text-sm mb-4"
          >
            ← Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">{page.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page.content ? (
          <div
            className="cms-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <p className="text-gray-500 italic">This page has no content yet.</p>
        )}
      </div>
    </div>
  );
}
