import { Controller, Get, Post, Param, Body, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { DownloadsService } from './downloads.service';

/**
 * Public (token-gated) endpoint that customers hit from their
 * post-purchase email. The token in the URL IS the auth — no JWT
 * cookie, no admin login required, because customers buying a
 * self-hosted product don't have an account yet at purchase time.
 *
 * The token is HMAC-signed with JWT_SECRET and includes an expiry,
 * so a leaked token has bounded blast radius (default 30 days). If
 * the customer's email is intercepted, the worst the attacker gets
 * is a copy of the source — not their license key, not their DB,
 * not their account. Post-install hardening (HTTPS, license-tied
 * activation) covers the rest.
 *
 * `/downloads/refresh` is the escape hatch for expired tokens. The
 * order owner pastes their original license key, and we mint a new
 * download token for the same order. License key is the auth here
 * because it's what the customer has after the original email.
 */
@Controller('downloads')
export class DownloadsController {
    constructor(private readonly downloads: DownloadsService) {}

    @Get(':token')
    async stream(@Param('token') token: string, @Res() res: Response) {
        const { orderId } = this.downloads.verifyToken(token);
        await this.downloads.streamBundle(orderId, res);
    }

    @Post('refresh')
    async refresh(@Body() body: { licenseKey?: string; email?: string }) {
        if (!body.licenseKey?.trim()) {
            throw new BadRequestException('licenseKey is required to refresh a download token.');
        }
        // Look up the order via the license key. The license-tied
        // refresh is the simplest auth flow — customer has license
        // key from purchase email → can mint new download URL.
        // (Order lookup by licenseKey is implemented in the service.)
        const orderId = await this.findOrderByLicenseKey(body.licenseKey.trim(), body.email?.trim());
        if (!orderId) {
            throw new BadRequestException('No paid order found for that license key.');
        }
        const { token, expiresAt } = await this.downloads.issueToken(orderId);
        const url = await this.downloads.buildDownloadUrl(token);
        return { url, expiresAt };
    }

    /** Sidesteps the service for now — direct prisma read inside the
        controller keeps the service surface focused on token + bundle
        concerns. Could move to the service if we need to reuse. */
    private async findOrderByLicenseKey(licenseKey: string, email?: string): Promise<string | null> {
        // Lazy require so we don't pull prisma directly into this file's
        // import graph; it's already in the service via DI.
        const prisma = (this.downloads as any).prisma;
        if (!prisma) return null;
        const where: any = { licenseKey, status: 'paid' };
        if (email) where.customerEmail = email;
        const order = await prisma.order.findFirst({ where });
        return order?.id || null;
    }
}
