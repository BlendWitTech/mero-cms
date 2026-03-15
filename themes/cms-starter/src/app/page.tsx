import { getSiteData, getPublishedPosts } from '@/lib/cms';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import HowItWorks from '@/components/sections/HowItWorks';
import Testimonials from '@/components/sections/Testimonials';
import BlogPreview from '@/components/sections/BlogPreview';
import Team from '@/components/sections/Team';
import CtaBanner from '@/components/sections/CtaBanner';

export default async function HomePage() {
  const [siteData, postsResponse] = await Promise.all([
    getSiteData(),
    getPublishedPosts({ page: 1, limit: 3 }),
  ]);

  const { settings, services, testimonials, team } = siteData;
  const recentPosts = postsResponse.data;

  return (
    <>
      <Hero settings={settings} />
      <Features id="features" services={services} />
      <HowItWorks />
      <Testimonials testimonials={testimonials} />
      <BlogPreview posts={recentPosts} />
      <Team id="team" members={team} />
      <CtaBanner settings={settings} />
    </>
  );
}
