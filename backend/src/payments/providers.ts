/**
 * Payment provider abstraction.
 *
 * Each provider implements the same interface so PaymentsService can
 * route purchase intents through a consistent pipeline. Adding a new
 * provider (Razorpay, PayPal, Paystack…) is one new class plus a
 * registry entry — nothing in the order lifecycle code changes.
 *
 * Notes on the contract:
 *   • initiateOrder() returns a `redirectUrl` for hosted-checkout flows
 *     (Stripe Checkout, Khalti web flow) OR a `formParams` object for
 *     query-string-signed redirects (eSewa). The frontend handles
 *     whichever shape it gets.
 *   • verifyEvent() takes a webhook (or return-URL) request and returns
 *     a normalised event { providerOrderId, status, amount, raw }.
 *     For providers without webhooks (eSewa), this is called from the
 *     return URL handler instead.
 *   • All provider interactions are pure-async; secrets come from env
 *     so different deploys can use test vs. live keys without a code
 *     change.
 */

export type ProviderId = 'stripe' | 'khalti' | 'esewa';

export interface InitiateInput {
    orderId: string;
    amountNPR: number;
    customerEmail: string;
    customerName?: string;
    description: string;
    successUrl: string;
    cancelUrl: string;
}

export interface InitiateResult {
    /** Where to send the user. Either a hosted checkout URL (Stripe,
        Khalti) or a form-post target (eSewa). */
    redirectUrl?: string;
    /** Form fields the frontend should POST to redirectUrl. Only set
        for providers that use signed-form redirects (eSewa). */
    formParams?: Record<string, string>;
    /** Provider-side order id we'll receive back in the webhook. */
    providerOrderId: string;
    /** Currency that was actually used for the charge (Stripe charges
        in USD/INR even if amountNPR is set). */
    chargedCurrency: string;
    chargedAmount: number;
}

export interface NormalisedEvent {
    providerOrderId: string;
    status: 'paid' | 'failed' | 'cancelled' | 'refunded' | 'unknown';
    amount?: number;
    failureReason?: string;
    raw: any;
}

export interface PaymentProvider {
    id: ProviderId;
    displayName: string;
    /** Currencies the provider supports natively. NPR is the source
        amount; if the provider doesn't accept NPR, it converts. */
    supportedCurrencies: string[];
    /** True when the provider is fully configured (env vars set). */
    isConfigured(): boolean;
    initiateOrder(input: InitiateInput): Promise<InitiateResult>;
    /** Verify a webhook payload (signature + body) or a return-URL
        callback. Returns the normalised event so the order lifecycle
        code doesn't care about provider-specific shapes. */
    verifyEvent(
        rawBody: string | Buffer,
        headers: Record<string, string>,
        query?: Record<string, string>,
    ): Promise<NormalisedEvent>;
}
