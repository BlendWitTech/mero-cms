import type { PaymentProvider, InitiateInput, InitiateResult, NormalisedEvent } from '../providers';

/**
 * Stripe Checkout — global payment provider for credit card / wallet
 * payments. Stripe doesn't accept NPR, so we convert to USD using a
 * fixed env-configured rate (NPR_TO_USD; defaults to ~135 = 1 USD).
 * Customers see USD on Stripe's hosted page.
 *
 * Flow:
 *   1. POST /v1/checkout/sessions → get session.id + session.url
 *   2. Redirect customer to session.url
 *   3. Stripe POSTs `checkout.session.completed` to our webhook
 *   4. We verify the signature with STRIPE_WEBHOOK_SECRET, look up the
 *      session, and mark the order paid
 *
 * Reference: https://stripe.com/docs/payments/checkout
 *
 * No `stripe` SDK dependency — using the REST API directly with fetch
 * keeps the dependency surface small. If we later need advanced
 * features (subscriptions, customer portal), pulling in the SDK is
 * still worth it.
 */
export class StripeProvider implements PaymentProvider {
    id = 'stripe' as const;
    displayName = 'Stripe (international)';
    supportedCurrencies = ['USD', 'INR', 'EUR'];

    private readonly secretKey: string;
    private readonly webhookSecret: string;
    /** NPR → USD divisor. Adjust via NPR_TO_USD env var. */
    private readonly nprToUsd: number;

    constructor() {
        this.secretKey = process.env.STRIPE_SECRET_KEY || '';
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        this.nprToUsd = Number(process.env.NPR_TO_USD) || 135;
    }

    isConfigured(): boolean {
        return !!this.secretKey && this.secretKey.startsWith('sk_');
    }

    async initiateOrder(input: InitiateInput): Promise<InitiateResult> {
        if (!this.isConfigured()) {
            throw new Error('STRIPE_SECRET_KEY not configured. Set it in env to enable Stripe.');
        }

        // Convert NPR to USD cents (Stripe uses smallest currency unit).
        const usd = input.amountNPR / this.nprToUsd;
        const usdCents = Math.max(50, Math.round(usd * 100)); // Stripe minimum charge $0.50

        // Build x-www-form-urlencoded body — Stripe's API doesn't
        // accept JSON for the legacy payment endpoints.
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('success_url', `${input.successUrl}&session_id={CHECKOUT_SESSION_ID}`);
        params.append('cancel_url', input.cancelUrl);
        params.append('customer_email', input.customerEmail);
        params.append('client_reference_id', input.orderId);
        params.append('line_items[0][quantity]', '1');
        params.append('line_items[0][price_data][currency]', 'usd');
        params.append('line_items[0][price_data][unit_amount]', String(usdCents));
        params.append('line_items[0][price_data][product_data][name]', input.description);
        params.append('metadata[order_id]', input.orderId);

        const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Stripe Checkout session failed (${res.status}): ${text.slice(0, 200)}`);
        }

        const data = await res.json() as { id: string; url: string };
        return {
            redirectUrl: data.url,
            providerOrderId: data.id,
            chargedCurrency: 'USD',
            chargedAmount: usdCents / 100,
        };
    }

    async verifyEvent(
        rawBody: string | Buffer,
        headers: Record<string, string>,
    ): Promise<NormalisedEvent> {
        // Stripe signs webhooks with stripe-signature. Verify before
        // trusting any field of the payload.
        const sigHeader = headers['stripe-signature'] || headers['Stripe-Signature'];
        if (!sigHeader || !this.webhookSecret) {
            return { providerOrderId: '', status: 'unknown', raw: { error: 'missing signature or secret' } };
        }

        const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
        if (!this.verifyStripeSignature(bodyStr, sigHeader)) {
            return { providerOrderId: '', status: 'unknown', raw: { error: 'invalid signature' } };
        }

        let event: any;
        try {
            event = JSON.parse(bodyStr);
        } catch {
            return { providerOrderId: '', status: 'unknown', raw: { error: 'malformed body' } };
        }

        // We only care about checkout.session.completed for one-time
        // purchases. Subscription events are handled by future
        // recurring-billing logic.
        if (event.type === 'checkout.session.completed') {
            const session = event.data?.object;
            return {
                providerOrderId: session?.id || '',
                status: session?.payment_status === 'paid' ? 'paid' : 'failed',
                amount: session?.amount_total ? session.amount_total / 100 : undefined,
                raw: event,
            };
        }
        if (event.type === 'checkout.session.async_payment_failed' || event.type === 'charge.failed') {
            return {
                providerOrderId: event.data?.object?.id || '',
                status: 'failed',
                failureReason: event.data?.object?.failure_message || 'declined',
                raw: event,
            };
        }
        return { providerOrderId: '', status: 'unknown', raw: event };
    }

    /**
     * Verify Stripe's HMAC-SHA256 signature against the webhook body.
     * Format of stripe-signature header:
     *   t=<unix>,v1=<sig>[,v0=<sig>]
     * We compute HMAC over `t.body` and compare to v1.
     */
    private verifyStripeSignature(body: string, header: string): boolean {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        const parts = header.split(',').map(p => p.split('='));
        const t = parts.find(([k]) => k === 't')?.[1];
        const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
        if (!t || !sigs.length) return false;

        const expected = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(`${t}.${body}`)
            .digest('hex');
        // Constant-time compare against any valid signature.
        return sigs.some(s => {
            if (s.length !== expected.length) return false;
            return crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex'));
        });
    }
}
