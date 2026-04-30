import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Query,
    Req,
    Headers,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import type { ProviderId } from './providers';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    /**
     * List which payment providers are usable on this deployment.
     * The marketing checkout page calls this to render only providers
     * that have credentials configured (e.g. hide eSewa for a US-only
     * deploy that hasn't set ESEWA_SECRET_KEY).
     */
    @Get('providers')
    listProviders() {
        return { providers: this.paymentsService.listAvailableProviders() };
    }

    /**
     * Create a pending Order and kick off the chosen provider. Returns
     * either { redirectUrl } (Stripe / Khalti) or { redirectUrl,
     * formParams } (eSewa). Frontend handles whichever shape it gets.
     *
     * No auth — this is a marketing-site purchase flow. The order
     * tracks the customer email; license is sent there after payment.
     */
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('orders')
    async createOrder(@Body() body: {
        customerEmail: string;
        customerName?: string;
        customerPhone?: string;
        itemType: 'package' | 'plugin' | 'cloud-tier' | 'maintenance';
        packageId?: string;
        pluginSlug?: string;
        cloudTierId?: string;
        amountNPR: number;
        provider: ProviderId;
        successUrl: string;
        cancelUrl: string;
        metadata?: Record<string, any>;
    }) {
        if (!body.customerEmail || !body.amountNPR || !body.provider) {
            throw new BadRequestException('customerEmail, amountNPR, and provider are required');
        }
        if (!['package', 'plugin', 'cloud-tier', 'maintenance'].includes(body.itemType)) {
            throw new BadRequestException(`Invalid itemType "${body.itemType}"`);
        }
        return this.paymentsService.createOrder(body);
    }

    /**
     * Order status — used by the success page to poll while waiting
     * for the webhook to arrive. Returns the license key once paid.
     */
    @Get('orders/:id')
    async getOrder(@Param('id') id: string) {
        return this.paymentsService.getOrder(id);
    }

    /**
     * Provider webhook receivers. Each takes the raw body + headers
     * and lets the provider verify the signature before processing.
     *
     * SkipThrottle because providers retry aggressively and we want
     * those retries to land. Auth is signature-based — no JWT.
     */
    @SkipThrottle()
    @Post(':provider/webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Param('provider') provider: ProviderId,
        @Req() req: any,
        @Headers() headers: Record<string, string>,
    ) {
        // We need the raw body for signature verification. Nest's
        // bodyParser usually JSON-parses for us, but Stripe demands
        // the raw bytes. main.ts opts /payments/*/webhook out of the
        // JSON parser and exposes `req.rawBody` instead.
        const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : '');
        return this.paymentsService.handleProviderEvent(provider, rawBody, headers);
    }

    /**
     * Return-URL handler — for Khalti and eSewa, this is where the
     * customer lands after paying. We treat it like a webhook but
     * read from query params instead of the body. Stripe doesn't use
     * this; its webhook is the source of truth.
     */
    @Get(':provider/return')
    async handleReturn(
        @Param('provider') provider: ProviderId,
        @Query() query: Record<string, string>,
        @Headers() headers: Record<string, string>,
    ) {
        return this.paymentsService.handleProviderEvent(provider, '', headers, query);
    }
}
