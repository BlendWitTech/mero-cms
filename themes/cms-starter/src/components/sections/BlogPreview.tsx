import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/lib/cms';
import { cmsImageUrl } from '@/lib/cms';

interface BlogPreviewProps {
  posts: Post[];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPreview({ posts }: BlogPreviewProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
              Latest Articles
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
              From the Blog
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors flex items-center gap-1 flex-shrink-0"
          >
            View all posts →
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id ?? post.slug}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
                {post.featuredImage ? (
                  <Image
                    src={cmsImageUrl(post.featuredImage)}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat.slug}
                        className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>

                {post.excerpt && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <span className="text-xs text-gray-400">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
