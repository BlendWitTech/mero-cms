import type { PaymentProvider, InitiateInput, InitiateResult, NormalisedEvent } from '../providers';

/**
 * eSewa — second-major Nepal payment gateway. Uses signed-form-redirect
 * pattern instead of API calls:
 *   1. Backend builds a signed payload (HMAC-SHA256 over comma-joined
 *      fields with ESEWA_SECRET_KEY).
 *   2. Frontend POSTs the form to eSewa's hosted page (`redirectUrl` +
 *      `formParams` from initiateOrder).
 *   3. After payment, eSewa redirects to our successUrl with `data`
 *      base64 query param containing the verification payload.
 *   4. We decode + verify the signature in `verifyEvent`.
 *
 * No real webhook — verification happens at the return URL.
 *
 * Reference: https://developer.esewa.com.np/pages/Epay
 */
export class EsewaProvider implements PaymentProvider {
    id = 'esewa' as const;
    displayName = 'eSewa';
    supportedCurrencies = ['NPR'];

    private readonly merchantId: string;
    private readonly secretKey: string;
    private readonly endpoint: string;

    constructor() {
        this.merchantId = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
        this.secretKey = process.env.ESEWA_SECRET_KEY || '';
        // Test endpoint by default. Live: https://epay.esewa.com.np/api/epay/main/v2/form
        this.endpoint =
            process.env.ESEWA_ENDPOINT ||
            'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    }

    isConfigured(): boolean {
        return !!this.secretKey;
    }

    async initiateOrder(input: InitiateInput): Promise<InitiateResult> {
        if (!this.isConfigured()) {
            throw new Error('ESEWA_SECRET_KEY not configured.');
        }

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        const totalAmount = input.amountNPR;
        const taxAmount = 0;
        const productServiceCharge = 0;
        const productDeliveryCharge = 0;

        // Signature is HMAC-SHA256 over a fixed comma-joined field set.
        // Order matters and must match what eSewa documents.
        const signed = `total_amount=${totalAmount},transaction_uuid=${input.orderId},product_code=${this.merchantId}`;
        const signature = crypto
            .createHmac('sha256', this.secretKey)
            .update(signed)
            .digest('base64');

        return {
            redirectUrl: this.endpoint,
            formParams: {
                amount: String(input.amountNPR),
                tax_amount: String(taxAmount),
                total_amount: String(totalAmount),
                transaction_uuid: input.orderId,
                product_code: this.merchantId,
                product_service_charge: String(productServiceCharge),
                product_delivery_charge: String(productDeliveryCharge),
                success_url: input.successUrl,
                failure_url: input.cancelUrl,
                signed_field_names: 'total_amount,transaction_uuid,product_code',
                signature,
            },
            providerOrderId: input.orderId,
            chargedCurrency: 'NPR',
            chargedAmount: input.amountNPR,
        };
    }

    async verifyEvent(
        _rawBody: string | Buffer,
        _headers: Record<string, string>,
        query?: Record<string, string>,
    ): Promise<NormalisedEvent> {
        // eSewa returns base64 `data` containing the response payload
        // and a signature over selected fields. We verify and report.
        const dataParam = query?.data;
        if (!dataParam) {
            return { providerOrderId: '', status: 'unknown', raw: { error: 'missing data' } };
        }

        let payload: any;
        try {
            payload = JSON.parse(Buffer.from(dataParam, 'base64').toString('utf8'));
        } catch {
            return { providerOrderId: '', status: 'unknown', raw: { error: 'malformed data' } };
        }

        // Verify the signature eSewa provides over signed_field_names.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        const fields: string[] = (payload.signed_field_names || '').split(',');
        const signedString = fields.map(f => `${f}=${payload[f]}`).join(',');
        const expected = crypto
            .createHmac('sha256', this.secretKey)
            .update(signedString)
            .digest('base64');
        if (expected !== payload.signature) {
            return {
                providerOrderId: payload.transaction_uuid || '',
                status: 'unknown',
                raw: { error: 'signature mismatch', payload },
            };
        }

        const statusMap: Record<string, NormalisedEvent['status']> = {
            COMPLETE: 'paid',
            PENDING: 'unknown',
            FAILED: 'failed',
            CANCELED: 'cancelled',
            FULL_REFUND: 'refunded',
            PARTIAL_REFUND: 'refunded',
        };
        return {
            providerOrderId: payload.transaction_uuid || '',
            status: statusMap[payload.status] || 'unknown',
            amount: payload.total_amount ? Number(payload.total_amount) : undefined,
            raw: payload,
        };
    }
}
