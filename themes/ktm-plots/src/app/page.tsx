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
  const sec   = (id: string) => getSection(pages, 'home', id);
  const show  = (id: string) => isSectionEnabled(pages, 'home', id);

  const heroSec  = sec('hero');
  const aboutSec = sec('about');
  const ctaSec   = sec('cta');

  // Merge section-level content overrides into settings
  const mergedSettings = {
    ...siteData.settings,
    ...(heroSec.data.title          && { heroTitle:       heroSec.data.title }),
    ...(heroSec.data.subtitle       && { heroSubtitle:    heroSec.data.subtitle }),
    ...(heroSec.data.bgImage        && { heroBgImage:     heroSec.data.bgImage }),
    ...(heroSec.data.bgVideo        && { heroBgVideo:     heroSec.data.bgVideo }),
    ...(heroSec.data.trustBadge     && { heroBadge:       heroSec.data.trustBadge }),
    ...(heroSec.data.buttons?.[0]?.text && { ctaText:     heroSec.data.buttons[0].text }),
    ...(heroSec.data.buttons?.[0]?.url  && { ctaUrl:      heroSec.data.buttons[0].url }),
    ...(heroSec.data.buttons?.[1]?.text && { cta2Text:    heroSec.data.buttons[1].text }),
    ...(heroSec.data.buttons?.[1]?.url  && { cta2Url:     heroSec.data.buttons[1].url }),
    ...(heroSec.data.brandName      && { heroBrandName:   heroSec.data.brandName }),
    ...(heroSec.data.brandSuffix    && { heroBrandSuffix: heroSec.data.brandSuffix }),
    ...(heroSec.data.brandEstYear   && { heroBrandYear:   heroSec.data.brandEstYear }),
    ...(aboutSec.data.title         && { aboutTitle:      aboutSec.data.title }),
    ...(aboutSec.data.content       && { aboutContent:    aboutSec.data.content }),
    ...(aboutSec.data.image         && { aboutImage:      aboutSec.data.image }),
    ...(ctaSec.data.buttons?.[0]?.text && { ctaText:      ctaSec.data.buttons[0].text }),
    ...(ctaSec.data.buttons?.[0]?.url  && { ctaUrl:       ctaSec.data.buttons[0].url }),
  };
  const enrichedSiteData = { ...siteData, settings: mergedSettings };

  // Stats: from Site Pages hero section, fallback to null (Hero.tsx has defaults)
  const heroStats = heroSec.data.stats as Array<{ value: string; label: string }> | undefined;

  // Banner items for bottom strip when image is set
  const heroBannerItems = heroSec.data.bannerItems as Array<{ value: string; label: string }> | undefined;

  // Plots limit from section config
  const plotLimit   = Number(sec('plots').data.limit) || 6;
  const limitedPlots = featuredPlots.slice(0, plotLimit);

  return (
    <>
      {show('hero')         && <Hero siteData={enrichedSiteData} stats={heroStats} bannerItems={heroBannerItems} />}
      {show('about')        && <About siteData={enrichedSiteData} secData={sec('about').data} />}
      {show('services')     && <Services services={siteData.services} secData={sec('services').data} />}
      {show('plots')        && <Plots plots={limitedPlots} secData={sec('plots').data} />}
      {show('testimonials') && <Testimonials testimonials={siteData.testimonials} secData={sec('testimonials').data} />}
      {show('cta')          && <CtaStrip siteData={enrichedSiteData} secData={sec('cta').data} />}

      {show('blog')         && <BlogPreview posts={siteData.recentPosts.slice(0, Number(sec('blog').data.limit) || 3)} secData={sec('blog').data} />}
    </>
  );
}
