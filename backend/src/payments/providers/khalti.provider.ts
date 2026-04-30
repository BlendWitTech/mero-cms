import type { PaymentProvider, InitiateInput, InitiateResult, NormalisedEvent } from '../providers';

/**
 * Khalti — Nepal's leading payment gateway. Uses their ePayment v2 API.
 *
 * Flow:
 *   1. POST /api/v2/epayment/initiate/ with amount + return URL → get pidx + payment_url
 *   2. Redirect customer to payment_url
 *   3. Customer pays on Khalti, gets bounced back to return URL with pidx as query param
 *   4. We POST /api/v2/epayment/lookup/ with that pidx to confirm status
 *
 * Khalti doesn't push a real webhook — `verifyEvent` here is called from
 * the return-URL handler, which extracts `pidx` from the query string.
 *
 * Reference: https://docs.khalti.com/khalti-epayment/
 */
export class KhaltiProvider implements PaymentProvider {
    id = 'khalti' as const;
    displayName = 'Khalti';
    supportedCurrencies = ['NPR'];

    private readonly secretKey: string;
    private readonly baseUrl: string;

    constructor() {
        this.secretKey = process.env.KHALTI_SECRET_KEY || '';
        // Test endpoint by default; flip to KHALTI_API_BASE=https://khalti.com/api/v2
        // for live mode.
        this.baseUrl =
            process.env.KHALTI_API_BASE ||
            'https://a.khalti.com/api/v2'; // test environment
    }

    isConfigured(): boolean {
        return !!this.secretKey && this.secretKey.length > 10;
    }

    async initiateOrder(input: InitiateInput): Promise<InitiateResult> {
        if (!this.isConfigured()) {
            throw new Error('KHALTI_SECRET_KEY not configured. Set it in env to enable Khalti.');
        }

        // Khalti expects amounts in paisa (1 NPR = 100 paisa).
        const amountPaisa = input.amountNPR * 100;

        const res = await fetch(`${this.baseUrl}/epayment/initiate/`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                return_url: input.successUrl,
                website_url: new URL(input.successUrl).origin,
                amount: amountPaisa,
                purchase_order_id: input.orderId,
                purchase_order_name: input.description.slice(0, 60),
                customer_info: {
                    name: input.customerName || input.customerEmail.split('@')[0],
                    email: input.customerEmail,
                },
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Khalti initiate failed (${res.status}): ${text.slice(0, 200)}`);
        }

        const data = await res.json() as { pidx: string; payment_url: string };
        return {
            redirectUrl: data.payment_url,
            providerOrderId: data.pidx,
            chargedCurrency: 'NPR',
            chargedAmount: input.amountNPR,
        };
    }

    async verifyEvent(
        _rawBody: string | Buffer,
        _headers: Record<string, string>,
        query?: Record<string, string>,
    ): Promise<NormalisedEvent> {
        // Khalti's "webhook" is the return URL — we get the pidx in
        // the query string and call lookup to get the canonical status.
        const pidx = query?.pidx;
        if (!pidx) {
            return { providerOrderId: '', status: 'unknown', raw: { error: 'missing pidx' } };
        }

        const res = await fetch(`${this.baseUrl}/epayment/lookup/`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pidx }),
        });

        if (!res.ok) {
            return { providerOrderId: pidx, status: 'unknown', raw: { httpStatus: res.status } };
        }

        const data = await res.json() as { status: string; total_amount: number; transaction_id?: string };
        const statusMap: Record<string, NormalisedEvent['status']> = {
            'Completed':       'paid',
            'Pending':         'unknown',
            'Initiated':       'unknown',
            'Refunded':        'refunded',
            'Expired':         'failed',
            'User canceled':   'cancelled',
            'Partially Refunded': 'refunded',
        };
        return {
            providerOrderId: pidx,
            status: statusMap[data.status] || 'unknown',
            amount: data.total_amount ? data.total_amount / 100 : undefined,
            raw: data,
        };
    }
}
