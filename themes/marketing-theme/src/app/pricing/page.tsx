import { getPackages, SiteData, getSiteData } from '@/lib/cms';
import PricingClient from '../../components/pricing/PricingClient';

export default async function PricingPage() {
    const [packages, siteData] = await Promise.all([
        getPackages(),
        getSiteData()
    ]);

    return <PricingClient packages={packages} siteData={siteData} />;
}
