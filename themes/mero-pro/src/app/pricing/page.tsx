import type { Metadata } from 'next';
import Reveal from '@/components/ui/Reveal';
import PageHero from '@/components/ui/PageHero';
import Button from '@/components/ui/Button';
import FAQ, { type FAQData } from '@/components/sections/FAQ';
import FinalCTA, { type FinalCTAData } from '@/components/sections/FinalCTA';
import { getPage, pickSection, getPackagesConfig, getCloudTiers } from '@/lib/api';
import PricingTable from './PricingTable';
import CloudTiersTable from './CloudTiersTable';

export const revalidate = 300;

export const metadata: Metadata = {
    title: 'Pricing',
    description:
        'Mero CMS is a one-time licence with eight tiers across personal and organizational use. Optional annual maintenance and Mero Cloud managed hosting.',
};

/**
 * Pricing page — driven entirely by the backend's packages-config and
 * cloud-tiers endpoints. Single prices (no ranges), explicit
 * maintenance fees, and a separate Mero Cloud add-on table.
 *
 * Layout
 *   1. Hero with primary/secondary CTAs.
 *   2. Personal vs Organizational toggle + tier cards (client component).
 *   3. Mero Cloud add-on table (server-rendered).
 *   4. FAQ + FinalCTA pulled from the CMS-authored pricing page.
 */
export default async function PricingPage() {
    const [page, personalTiers, orgTiers, cloudTiers] = await Promise.all([
        getPage('pricing'),
        getPackagesConfig('personal'),
        getPackagesConfig('organizational'),
        getCloudTiers(),
    ]);

    return (
        <Reveal>
            <main>
                <PageHero
                    eyebrow="Pricing"
                    title={
                        <>
                            One-time licence.{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                Eight tiers.
                            </span>
                        </>
                    }
                    subtitle="Pick the tier that matches your team. Lifetime use of the version you bought, optional annual maintenance for updates, and Mero Cloud if you'd rather we host it."
                    actions={
                        <>
                            <Button href="/signup" variant="brand" size="lg">
                                Start free →
                            </Button>
                            <Button href="/contact" variant="light" size="lg">
                                Talk to sales
                            </Button>
                        </>
                    }
                />

                {/* Tier cards with personal / organizational toggle.
                    Client component because the toggle is interactive. */}
                <PricingTable personalTiers={personalTiers} orgTiers={orgTiers} />

                {/* Mero Cloud add-on. Pure server-render — no toggle. */}
                {cloudTiers.length > 0 && <CloudTiersTable tiers={cloudTiers} />}

                <FAQ data={pickSection<FAQData>(page, 'faq')} />
                <FinalCTA data={pickSection<FinalCTAData>(page, 'cta')} />
            </main>
        </Reveal>
    );
}
