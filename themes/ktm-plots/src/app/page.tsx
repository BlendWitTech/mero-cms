import { getSiteData, getFeaturedPlots } from '@/lib/cms';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Plots from '@/components/sections/Plots';
import Testimonials from '@/components/sections/Testimonials';
import BlogPreview from '@/components/sections/BlogPreview';

export default async function HomePage() {
  const [siteData, featuredPlots] = await Promise.all([
    getSiteData(),
    getFeaturedPlots(),
  ]);

  return (
    <>
      <Hero siteData={siteData} />
      <About />
      <Services services={siteData.services} />
      <Plots plots={featuredPlots} />
      <Testimonials testimonials={siteData.testimonials} />
      <BlogPreview posts={siteData.recentPosts} />
    </>
  );
}
