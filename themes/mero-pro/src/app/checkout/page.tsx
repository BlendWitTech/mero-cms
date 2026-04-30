import type { Metadata } from 'next';
import Reveal from '@/components/ui/Reveal';
import PageHero from '@/components/ui/PageHero';
import { getPackagesConfig, getCloudTiers, getPaymentProviders } from '@/lib/api';
import CheckoutForm from './CheckoutForm';

export const metadata: Metadata = {
    title: 'Checkout',
    description: 'Complete your Mero CMS purchase.',
    robots: { index: false, follow: false },
};

/**
 * Checkout entry point. Customer arrives here from /pricing with one of:
 *   ?package=personal-premium     CMS license tier
 *   ?cloud=cloud-business         Mero Cloud annual subscription
 *   ?plugin=visual-editor         Plugin marketplace purchase (rare;
 *                                 admin usually initiates these)
 *
 * Server-render the available items + providers, hand off to the
 * client form for the actual submit. Only configured providers are
 * shown — the marketing checkout never offers something we can't
 * actually charge.
 */
export default async function CheckoutPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const [personalTiers, orgTiers, cloudTiers, providers] = await Promise.all([
        getPackagesConfig('personal'),
        getPackagesConfig('organizational'),
        getCloudTiers(),
        getPaymentProviders(),
    ]);

    // Resolve the item being purchased.
    const allTiers = [...personalTiers, ...orgTiers];
    const pkg = params.package ? allTiers.find(p => p.id === params.package) : undefined;
    const cloud = params.cloud ? cloudTiers.find(c => c.id === params.cloud) : undefined;

    if (!pkg && !cloud) {
        return (
            <Reveal>
                <main>
                    <PageHero
                        eyebrow="Checkout"
                        title="Pick a package first"
                        subtitle="Head back to pricing to choose what you'd like to buy."
                    />
                </main>
            </Reveal>
        );
    }

    const itemType: 'package' | 'cloud-tier' = pkg ? 'package' : 'cloud-tier';
    const amountNPR = pkg
        ? (pkg.priceNPR === 'custom' ? (pkg.priceFromNPR ?? 0) : pkg.priceNPR)
        : (cloud?.annualNPR ?? 0);
    const itemId = pkg?.id || cloud?.id || '';
    const itemName = pkg?.name ? `${pkg.name} (${pkg.websiteType})` : cloud?.name || 'Mero CMS';

    return (
        <Reveal>
            <main>
                <PageHero
                    eyebrow="Checkout"
                    title={
                        <>
                            One step to{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                {itemName}
                            </span>
                            .
                        </>
                    }
                    subtitle="Pick a payment method and we'll handle the rest. License key delivered immediately after payment."
                />

                <CheckoutForm
                    itemType={itemType}
                    itemId={itemId}
                    itemName={itemName}
                    amountNPR={amountNPR}
                    providers={providers}
                    pkg={pkg}
                    cloud={cloud}
                />
            </main>
        </Reveal>
    );
}
