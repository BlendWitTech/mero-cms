import { getSiteData, getFeaturedPlots, getSection, isSectionEnabled, type PageRecord } from '@/lib/cms';
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

  const pages = (siteData as any).pages as PageRecord[] ?? [];

  // Helper: read a field from the "home" page's section config
  const sec = (sectionId: string) => getSection(pages, 'home', sectionId);
  const show = (sectionId: string) => isSectionEnabled(pages, 'home', sectionId);

  // Merge section-level overrides into siteData.settings so existing
  // components continue to work without needing a new prop
  const heroSec = sec('hero');
  const aboutSec = sec('about');
  const ctaSec = sec('cta');

  const mergedSettings = {
    ...siteData.settings,
    // Hero overrides from Site Pages editor
    ...(heroSec.data.title       && { heroTitle:   heroSec.data.title }),
    ...(heroSec.data.subtitle    && { heroSubtitle: heroSec.data.subtitle }),
    ...(heroSec.data.bgImage     && { heroBgImage:  heroSec.data.bgImage }),
    ...(heroSec.data.bgVideo     && { heroBgVideo:  heroSec.data.bgVideo }),
    ...(heroSec.data.buttons?.[0]?.text && { ctaText: heroSec.data.buttons[0].text }),
    ...(heroSec.data.buttons?.[0]?.url  && { ctaUrl:  heroSec.data.buttons[0].url }),
    // About overrides
    ...(aboutSec.data.title   && { aboutTitle:   aboutSec.data.title }),
    ...(aboutSec.data.content && { aboutContent: aboutSec.data.content }),
    ...(aboutSec.data.image   && { aboutImage:   aboutSec.data.image }),
    // CTA overrides
    ...(ctaSec.data.buttons?.[0]?.text && { ctaText: ctaSec.data.buttons[0].text }),
    ...(ctaSec.data.buttons?.[0]?.url  && { ctaUrl:  ctaSec.data.buttons[0].url }),
  };

  const enrichedSiteData = { ...siteData, settings: mergedSettings };

  // Plots section config
  const plotsSec = sec('plots');
  const plotLimit = Number(plotsSec.data.limit) || 6;
  const limitedPlots = featuredPlots.slice(0, plotLimit);

  return (
    <>
      {show('hero') && <Hero siteData={enrichedSiteData} />}
      {show('about') && <About siteData={enrichedSiteData} />}
      {show('services') && <Services services={siteData.services} />}
      {show('plots') && <Plots plots={limitedPlots} />}
      {show('testimonials') && <Testimonials testimonials={siteData.testimonials} />}
      {show('cta') && <CtaStrip siteData={enrichedSiteData} />}
      {show('blog') && <BlogPreview posts={siteData.recentPosts.slice(0, Number(sec('blog').data.limit) || 3)} />}
    </>
  );
}
