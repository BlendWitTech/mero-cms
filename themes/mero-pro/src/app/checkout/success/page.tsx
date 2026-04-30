import type { Metadata } from 'next';
import Reveal from '@/components/ui/Reveal';
import PageHero from '@/components/ui/PageHero';
import SuccessPolling from './SuccessPolling';

export const metadata: Metadata = {
    title: 'Payment received',
    description: 'Your Mero CMS purchase is being processed.',
    robots: { index: false, follow: false },
};

/**
 * Success landing page. Customer arrives here after the provider's
 * checkout. We have one of:
 *   ?orderId=…                        from our own redirect template
 *   ?session_id=… (Stripe)            we resolve via providerOrderId
 *   ?pidx=… (Khalti) — already verified by the return-URL handler
 *   ?data=… (eSewa)
 *
 * The polling component handles all four shapes — it asks the
 * backend until status leaves `pending`. Once paid, it shows the
 * license key + setup instructions.
 */
export default async function SuccessPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const orderId = params.orderId || '';
    const providerOrderId =
        params.session_id || // Stripe
        params.pidx ||       // Khalti
        '';

    return (
        <Reveal>
            <main>
                <PageHero
                    eyebrow="Payment received"
                    title={
                        <>
                            Welcome to{' '}
                            <span className="serif-em" style={{ color: 'var(--brand)' }}>
                                Mero CMS.
                            </span>
                        </>
                    }
                    subtitle="Hang tight — we're confirming your payment with the provider. This usually takes a few seconds."
                />

                <SuccessPolling orderId={orderId} providerOrderId={providerOrderId} />
            </main>
        </Reveal>
    );
}
