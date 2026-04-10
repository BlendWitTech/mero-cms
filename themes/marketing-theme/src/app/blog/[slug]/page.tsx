import { getPostBySlug, cmsImageUrl } from '@/lib/cms';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Prose from '@/components/ui/Prose';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserCircleIcon,
  ShareIcon,
  BookmarkSquareIcon
} from '@heroicons/react/24/outline';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    if (!post) return {};
    return {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      openGraph: post.featuredImage ? { 
        images: [{ url: cmsImageUrl(post.featuredImage) }],
        type: 'article',
        publishedTime: post.publishedAt,
      } : undefined,
    };
  } catch (error) {
    return { title: 'Blog Post' };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) notFound();

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      {/* Article Header */}
      <header className="container-custom max-w-4xl mb-12 sm:mb-20 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <Link 
            href="/blog" 
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Journal
          </Link>
          <div className="flex items-center gap-4">
             <button className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                <ShareIcon className="h-5 w-5" />
             </button>
             <button className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                <BookmarkSquareIcon className="h-5 w-5" />
             </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {post.categories?.map(cat => (
              <Badge key={cat.id} variant="primary" size="md">{cat.name}</Badge>
            ))}
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter font-display leading-[0.95]">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-lg">
                 {post.author?.avatar ? (
                   <img src={cmsImageUrl(post.author.avatar)} alt={post.author.name} className="w-full h-full rounded-full object-cover" />
                 ) : (
                   <UserCircleIcon className="h-6 w-6 text-slate-400" />
                 )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Written by</p>
                <p className="text-sm font-bold text-slate-900">{post.author?.name || 'Mero Editorial'}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-100 hidden sm:block" />
            
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Published on</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary-600" />
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="container-custom max-w-5xl mb-16 sm:mb-24">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary-600/10 border border-slate-100">
            <img
              src={cmsImageUrl(post.featuredImage)}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[600px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="container-custom max-w-3xl mb-32">
        <Prose html={post.content || ''} />
        
        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag.id} variant="secondary" size="md">#{tag.name}</Badge>
            ))}
          </div>
        )}
        
        {/* Author Bio Card (Mini) */}
        <div className="mt-20 p-8 sm:p-12 glass-card !border-primary-600/10 bg-slate-50/50 space-y-4">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.25rem] bg-white p-1 shadow-xl shadow-primary-600/5">
                <div className="w-full h-full rounded-[1rem] bg-slate-100 flex items-center justify-center overflow-hidden">
                   {post.author?.avatar ? (
                     <img src={cmsImageUrl(post.author.avatar)} alt={post.author.name} className="w-full h-full object-cover" />
                   ) : (
                     <UserCircleIcon className="h-10 w-10 text-slate-200" />
                   )}
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 font-display">About the Author</h4>
                <p className="text-sm font-bold text-primary-600">{post.author?.name || 'Mero CMS Editorial'}</p>
              </div>
           </div>
           <p className="text-sm font-medium text-slate-500 leading-relaxed">
             Insights and technical guides from the core team. We build Mero CMS to empower developers and content teams with high-resolution digital infrastructure.
           </p>
        </div>
      </article>

      {/* CTA Section */}
      <section className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="container-custom max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Ready to build your own blog?</h2>
          <p className="text-slate-500 font-medium">Download Mero CMS today and launch a premium Next.js content experience in minutes.</p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
             <Button size="lg" href="https://demo.mero-cms.com">Try Demo</Button>
             <Button size="lg" variant="outline" href="/pricing">View Plans</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
