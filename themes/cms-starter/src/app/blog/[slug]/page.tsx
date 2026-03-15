import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, cmsImageUrl } from '@/lib/cms';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || '',
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      images: post.featuredImage ? [cmsImageUrl(post.featuredImage)] : [],
    },
  };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center text-indigo-200 hover:text-white transition-colors text-sm mb-6"
          >
            ← Back to Blog
          </Link>

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((cat) => (
                <span
                  key={cat.slug}
                  className="text-xs font-semibold text-indigo-900 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-indigo-100 text-lg leading-relaxed mb-6 max-w-3xl">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-indigo-200 text-sm">
            {post.author?.name && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
                <span>{post.author.name}</span>
              </div>
            )}
            {(post.publishedAt || post.createdAt) && (
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-1">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag.slug} className="text-indigo-300">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured image */}
      {post.featuredImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={cmsImageUrl(post.featuredImage)}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="cms-content"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            ← Back to all posts
          </Link>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
