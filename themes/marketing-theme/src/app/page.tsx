import { getSiteData, getPackages } from '@/lib/cms';
import HomeClient from '@/components/home/HomeClient';

export default async function HomePage() {
  const [siteData, packages] = await Promise.all([
    getSiteData(),
    getPackages()
  ]);

  return <HomeClient siteData={siteData} packages={packages} />;
}
