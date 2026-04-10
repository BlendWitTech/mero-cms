'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { getPublishedPosts, type Post, cmsImageUrl } from '@/lib/cms';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PostCard({ post, i }: { post: Post; i: number }) {
  return (
    <motion.div variants={fadeUp} custom={i}>
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <div className="h-full flex flex-col bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:border-blue-200/80 hover:-translate-y-1 transition-all duration-500">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
            {post.featuredImage ? (
              <img
                src={cmsImageUrl(post.featuredImage)}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600/15 via-violet-600/10 to-cyan-600/15 flex items-center justify-center">
                <span className="text-5xl opacity-40">📝</span>
              </div>
            )}
            {post.categories?.slice(0, 1).map((cat) => (
              <span
                key={cat.id}
                className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-black px-3 py-1 rounded-full border border-blue-100 shadow-sm uppercase tracking-widest"
              >
                {cat.name}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="p-7 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Draft'}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" /> 6 min read
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
              )}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Read Article <ArrowRightIcon className="h-3 w-3 stroke-[3]" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogListingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPublishedPosts({ limit: 50 }).then(({ data }) => {
      setPosts(data);
      setFiltered(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q)) : posts);
  }, [search, posts]);

  return (
    <div className="overflow-x-hidden bg-white">

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
          <motion.div
            className="absolute -top-20 right-0 w-[600px] h-[600px] rounded-full bg-violet-400/8 blur-[120px]"
            animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-700"
            >
              <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
              Expert Insights
            </motion.span>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-6 text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-[0.88]"
            >
              The Mero CMS{' '}
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Journal
              </span>
              .
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-5 text-xl text-slate-500 font-medium leading-relaxed">
              Deep dives into headless architecture, Next.js performance, and the future of digital content management.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeUp} custom={3} className="mt-8 relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles by title or topic…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-400 shadow-sm transition-all"
              />
            </motion.div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── Posts Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-[2rem]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50">
            <p className="text-xl font-bold text-slate-900">No articles found.</p>
            <p className="text-slate-500 mt-2 font-medium">Try a different search or check back later.</p>
          </div>
        ) : (
          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((post, i) => (
              <PostCard key={post.id} post={post} i={i} />
            ))}
          </AnimatedSection>
        )}
      </section>

      {/* ── Dark CTA ── */}
      <section className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 variants={fadeUp} custom={0} className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-[0.9]">
            Ready to build your website?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-4 text-lg text-slate-400 font-medium max-w-xl mx-auto">
            Join hundreds of teams using Mero CMS to power their digital presence.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5"
            >
              View Pricing <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 border border-white/10 transition-all"
            >
              Try Free Demo
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

    </div>
  );
}
