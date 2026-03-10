import { getSiteData, getFeaturedPlots } from '@/lib/cms';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Plots from '@/components/sections/Plots';
import Testimonials from '@/components/sections/Testimonials';
import CtaStrip from '@/components/sections/CtaStrip';
import BlogPreview from '@/components/sections/BlogPreview';

export default async function HomePage() {
  const [siteData, featuredPlots] = await Promise.all([
    getSiteData(),
    getFeaturedPlots(),
  ]);

  return (
    <>
      {/* 1. Hero — CMS-controlled title, subtitle, background image */}
      <Hero siteData={siteData} />

      {/* 2. About — CMS-controlled title, content, optional about image */}
      <About siteData={siteData} />

      {/* 3. Services — from CMS Services module */}
      <Services services={siteData.services} />

      {/* 4. Plots (Projects) — featured plots from CMS Projects module */}
      <Plots plots={featuredPlots} />

      {/* 5. Testimonials — from CMS Testimonials module */}
      <Testimonials testimonials={siteData.testimonials} />

      {/* 6. CTA strip — with contact info and CTA button */}
      <CtaStrip siteData={siteData} />

      {/* 7. Blog preview — latest 3 published posts */}
      <BlogPreview posts={siteData.recentPosts} />
    </>
  );
}
