import { getPageBySlug, getSeoMeta, cmsImageUrl } from '@/lib/cms';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Prose from '@/components/ui/Prose';
import Badge from '@/components/ui/Badge';
import { 
  CalendarIcon, 
  DocumentTextIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [page, seo] = await Promise.all([
      getPageBySlug(slug), 
      getSeoMeta(`/${slug}`)
    ]);
    if (!page) return {};
    return {
      title: seo?.title || page.metaTitle || page.title,
      description: seo?.description || page.metaDescription,
    };
  } catch (error) {
    return { title: 'Page' };
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  
  if (!page) notFound();

  // Determine page type for iconography
  const isLegal = slug.includes('privacy') || slug.includes('terms') || slug.includes('policy');

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Dynamic Page Header */}
      <header className="container-custom max-w-4xl mb-12 sm:mb-20 text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
           <Badge variant={isLegal ? 'success' : 'primary'} size="md" className="gap-2">
              {isLegal ? <ShieldCheckIcon className="h-3.5 w-3.5" /> : <DocumentTextIcon className="h-3.5 w-3.5" />}
              {isLegal ? 'Official Policy' : 'Information'}
           </Badge>
        </div>
        <h1 className="text-4xl sm:text-7xl font-black text-slate-900 tracking-tighter font-display leading-[0.95]">
          {page.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Updated {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
           <span className="h-1 w-1 rounded-full bg-slate-300" />
           <span>v1.0.4</span>
        </div>
      </header>

      {/* Page Content Area */}
      <article className="container-custom max-w-3xl mb-32 bg-white rounded-[2.5rem] p-8 sm:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/5 blur-3xl -z-10" />

        {page.content ? (
          <Prose html={page.content} />
        ) : (
          <div className="py-20 text-center space-y-4">
             <div className="text-4xl">📄</div>
             <p className="text-slate-400 font-medium italic">This page is currently being drafted by our content team.</p>
          </div>
        )}
      </article>

      {/* Trust Footer */}
      <section className="container-custom max-w-3xl text-center">
         <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
           Need clarification on our policies? Contact our legal and support team at 
           <a href="mailto:support@mero-cms.com" className="text-primary-600 ml-1 hover:underline">legal@mero-cms.com</a>
         </p>
      </section>
    </div>
  );
}
