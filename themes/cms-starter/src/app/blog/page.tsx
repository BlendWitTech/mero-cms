import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPublishedPosts, cmsImageUrl } from '@/lib/cms';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'News, tutorials and updates from the Mero CMS team.',
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const limit = 9;

  const postsResponse = await getPublishedPosts({ page: currentPage, limit });
  const { data: posts, totalPages } = postsResponse;

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            The Mero CMS Blog
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
            Tutorials, updates and best practices from the team building Mero CMS.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✍️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-500">Check back soon for articles from the team.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id ?? post.slug}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
                >
                  {/* Featured image */}
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
                        <span className="text-white text-4xl font-black opacity-30">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat.slug}
                            className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {currentPage > 1 && (
                  <Link
                    href={`/blog?page=${currentPage - 1}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors text-sm font-medium"
                  >
                    ← Previous
                  </Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link
                    key={page}
                    href={`/blog?page=${page}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600'
                    }`}
                  >
                    {page}
                  </Link>
                ))}

                {currentPage < totalPages && (
                  <Link
                    href={`/blog?page=${currentPage + 1}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors text-sm font-medium"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
