import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PackagesService } from '../packages/packages.service';
import { SaasLicenseService } from '../packages/license.service';
import { MailService } from '../mail/mail.service';
import { DownloadsService } from '../downloads/downloads.service';
import type { PaymentProvider, ProviderId, NormalisedEvent } from './providers';
import { KhaltiProvider } from './providers/khalti.provider';
import { StripeProvider } from './providers/stripe.provider';
import { EsewaProvider } from './providers/esewa.provider';

interface CreateOrderInput {
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
}

/**
 * Orchestrates the full purchase lifecycle.
 *
 * Order states (set on `order.status`):
 *   pending → paid    happy path
 *   pending → failed  webhook reported failure
 *   pending → cancelled  customer abandoned (return URL with cancel)
 *   paid → refunded   manual / refund webhook
 *
 * The license JWT is signed at the moment the status transitions to
 * paid and stored on the order so the success page can display it
 * without depending on email delivery. Idempotent: a webhook that
 * fires twice for the same providerOrderId won't double-issue.
 */
@Injectable()
export class PaymentsService {
    private readonly providers: Map<ProviderId, PaymentProvider>;

    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private packagesService: PackagesService,
        private licenseService: SaasLicenseService,
        // MailService + DownloadsService close the post-purchase delivery
        // gap — the license JWT was always being signed and stored on
        // the order, but never sent to the customer. Now we email the
        // license + an embedded download link the moment the webhook
        // marks the order paid.
        private mailService: MailService,
        private downloadsService: DownloadsService,
    ) {
        this.providers = new Map<ProviderId, PaymentProvider>([
            ['khalti', new KhaltiProvider()],
            ['stripe', new StripeProvider()],
            ['esewa',  new EsewaProvider()],
        ]);
    }

    /**
     * Surface which providers are usable in the current deployment so
     * the marketing checkout page can hide unconfigured ones.
     */
    listAvailableProviders() {
        return Array.from(this.providers.values())
            .filter(p => p.isConfigured())
            .map(p => ({ id: p.id, displayName: p.displayName, currencies: p.supportedCurrencies }));
    }

    /**
     * Create a pending Order, kick off the provider, and hand the
     * frontend everything it needs to redirect the customer.
     */
    async createOrder(input: CreateOrderInput) {
        const provider = this.providers.get(input.provider);
        if (!provider) throw new BadRequestException(`Unknown provider "${input.provider}"`);
        if (!provider.isConfigured()) {
            throw new BadRequestException(
                `Payment provider "${input.provider}" isn't configured on this deployment.`,
            );
        }

        // Persist a pending row first — even if initiate fails we want
        // the audit trail.
        const order = await (this.prisma as any).order.create({
            data: {
                customerEmail:  input.customerEmail.toLowerCase().trim(),
                customerName:   input.customerName,
                customerPhone:  input.customerPhone,
                itemType:       input.itemType,
                packageId:      input.packageId,
                pluginSlug:     input.pluginSlug,
                cloudTierId:    input.cloudTierId,
                amountNPR:      input.amountNPR,
                provider:       input.provider,
                status:         'pending',
                metadata:       input.metadata ?? {},
            },
        });

        try {
            const description = this.describeItem(input);
            const result = await provider.initiateOrder({
                orderId:       order.id,
                amountNPR:     input.amountNPR,
                customerEmail: input.customerEmail,
                customerName:  input.customerName,
                description,
                successUrl:    input.successUrl,
                cancelUrl:     input.cancelUrl,
            });

            await (this.prisma as any).order.update({
                where: { id: order.id },
                data: {
                    providerOrderId: result.providerOrderId,
                    amountCharged:   Math.round(result.chargedAmount),
                    currency:        result.chargedCurrency,
                },
            });

            return {
                orderId:       order.id,
                redirectUrl:   result.redirectUrl,
                formParams:    result.formParams,
                providerOrderId: result.providerOrderId,
            };
        } catch (err: any) {
            await (this.prisma as any).order.update({
                where: { id: order.id },
                data:  { status: 'failed', failureReason: err?.message?.slice(0, 500) },
            });
            throw new BadRequestException(`Payment initiation failed: ${err?.message}`);
        }
    }

    /**
     * Process a webhook (or return-URL callback) from a provider. Idempotent:
     * re-running with the same providerOrderId is a no-op once the order is
     * already in a terminal state.
     */
    async handleProviderEvent(
        providerId: ProviderId,
        rawBody: string | Buffer,
        headers: Record<string, string>,
        query?: Record<string, string>,
    ): Promise<{ orderId?: string; status: string }> {
        const provider = this.providers.get(providerId);
        if (!provider) throw new BadRequestException(`Unknown provider "${providerId}"`);

        const event = await provider.verifyEvent(rawBody, headers, query);
        if (!event.providerOrderId) {
            return { status: 'ignored' }; // can't correlate; nothing to do
        }

        const order = await (this.prisma as any).order.findFirst({
            where: { providerOrderId: event.providerOrderId, provider: providerId },
        });
        if (!order) {
            return { status: 'unknown_order' };
        }

        // Idempotency — terminal states are sticky.
        if (['paid', 'refunded'].includes(order.status) && event.status !== 'refunded') {
            return { orderId: order.id, status: order.status };
        }

        switch (event.status) {
            case 'paid':
                await this.markOrderPaid(order, event);
                return { orderId: order.id, status: 'paid' };
            case 'failed':
                await (this.prisma as any).order.update({
                    where: { id: order.id },
                    data: {
                        status: 'failed',
                        failureReason: event.failureReason || 'reported by provider',
                        providerPayload: event.raw,
                    },
                });
                return { orderId: order.id, status: 'failed' };
            case 'cancelled':
                await (this.prisma as any).order.update({
                    where: { id: order.id },
                    data: { status: 'cancelled', providerPayload: event.raw },
                });
                return { orderId: order.id, status: 'cancelled' };
            case 'refunded':
                await (this.prisma as any).order.update({
                    where: { id: order.id },
                    data: { status: 'refunded', providerPayload: event.raw },
                });
                return { orderId: order.id, status: 'refunded' };
            default:
                // Pending / unknown — just stash the payload for debug.
                await (this.prisma as any).order.update({
                    where: { id: order.id },
                    data: { providerPayload: event.raw },
                });
                return { orderId: order.id, status: 'pending' };
        }
    }

    /** Used by the success page to poll status while the webhook is in flight. */
    async getOrder(id: string) {
        const order = await (this.prisma as any).order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        return {
            id: order.id,
            status: order.status,
            customerEmail: order.customerEmail,
            licenseKey: order.licenseKey,
            licenseExpiresAt: order.licenseExpiresAt,
            paidAt: order.paidAt,
            failureReason: order.failureReason,
            itemType: order.itemType,
            packageId: order.packageId,
            pluginSlug: order.pluginSlug,
            cloudTierId: order.cloudTierId,
            amountNPR: order.amountNPR,
            currency: order.currency,
        };
    }

    // ── Internal helpers ────────────────────────────────────────────

    private async markOrderPaid(order: any, event: NormalisedEvent) {
        let licenseKey: string | undefined;
        let licenseExpiresAt: Date | undefined;

        // Sign a license JWT for package + maintenance purchases. Plugin
        // and cloud-tier purchases don't issue a license key — the
        // backend just records that they're entitled.
        if (order.itemType === 'package' || order.itemType === 'maintenance') {
            const pkg = await (this.prisma as any).package.findUnique({
                where: { id: order.packageId },
            });
            if (pkg) {
                const tierName = this.tierNameFromPackageId(order.packageId);
                if (tierName) {
                    const signed = this.licenseService.signLicense({
                        customerEmail: order.customerEmail,
                        packageId:     order.packageId,
                        tier:          tierName,
                        // Maintenance: 1 year. Package license: lifetime
                        // for the version, but we still expire the JWT
                        // at 10 years so the customer renews periodically.
                        expiresAt: order.itemType === 'maintenance'
                            ? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
                            : new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString(),
                    });
                    licenseKey = signed.token;
                    licenseExpiresAt = new Date(signed.expiresAt);
                }
            }
        }

        await (this.prisma as any).order.update({
            where: { id: order.id },
            data: {
                status: 'paid',
                paidAt: new Date(),
                licenseKey,
                licenseExpiresAt,
                providerPayload: event.raw,
            },
        });

        // ── Post-purchase delivery ───────────────────────────────
        // Fire-and-forget so a flaky SMTP server doesn't fail the
        // webhook back to the payment provider (which would trigger
        // retries and worst-case a duplicate-charge customer-support
        // mess). If email fails we log it loudly; the customer can
        // re-request via /downloads/refresh with their license key.
        this.deliverPurchase({
            orderId: order.id,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            licenseKey,
            licenseExpiresAt,
            itemType: order.itemType,
            packageId: order.packageId,
            pluginSlug: order.pluginSlug,
        }).catch((err) => {
            this.logger.error(
                `Post-purchase delivery failed for order ${order.id}: ${err?.message}`,
                err?.stack,
            );
        });
    }

    /**
     * Send the customer the license key (if any) and a signed download
     * URL (for package + maintenance orders). This is what closes the
     * "I bought a CMS, now where do I get it?" loop.
     *
     * Plugin orders skip the download URL — plugins ship as catalog
     * manifests installed in-product, not as standalone tarballs.
     * Cloud-tier orders skip both — the customer's account just gets
     * provisioned automatically; nothing to download.
     */
    private async deliverPurchase(opts: {
        orderId: string;
        customerEmail: string;
        customerName: string | null;
        licenseKey?: string;
        licenseExpiresAt?: Date;
        itemType: string;
        packageId: string | null;
        pluginSlug: string | null;
    }): Promise<void> {
        const isPackageDownload = opts.itemType === 'package' || opts.itemType === 'maintenance';

        // Mint a download URL for the source bundle. Default 30-day
        // TTL — long enough for vacationers to come back, short enough
        // that a leaked URL doesn't survive forever.
        let downloadUrl: string | undefined;
        let downloadExpiresAt: Date | undefined;
        if (isPackageDownload) {
            try {
                const { token, expiresAt } = await this.downloadsService.issueToken(opts.orderId);
                downloadUrl = await this.downloadsService.buildDownloadUrl(token);
                downloadExpiresAt = expiresAt;
            } catch (err: any) {
                // Don't block email delivery on a download-token issue
                // — customer at least gets the license key. Log and move on.
                this.logger.warn(
                    `Could not mint download token for order ${opts.orderId}: ${err?.message}`,
                );
            }
        }

        const greeting = opts.customerName ? `Hi ${this.escape(opts.customerName)},` : 'Hi,';
        const itemDescription = this.describeItem({
            itemType: opts.itemType as any,
            packageId: opts.packageId || undefined,
            pluginSlug: opts.pluginSlug || undefined,
        } as any);

        const innerHtml = `
            <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#1E1E1E;line-height:1.2;">Thank you for your purchase</h2>
            <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">${greeting} your <strong>${this.escape(itemDescription)}</strong> is ready. Everything you need is in this email.</p>

            ${opts.licenseKey ? `
                <h3 style="margin:24px 0 8px;font-size:14px;font-weight:800;color:#1E1E1E;letter-spacing:-0.01em;">Your license key</h3>
                <p style="margin:0 0 12px;font-size:12px;color:#6B7280;line-height:1.6;">Paste this into the setup wizard's License &amp; Modules step. Keep it safe — it activates your tier on every install.</p>
                <pre style="margin:0 0 8px;padding:14px 16px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#1E1E1E;white-space:pre-wrap;word-break:break-all;">${this.escape(opts.licenseKey)}</pre>
                ${opts.licenseExpiresAt ? `<p style="margin:0 0 24px;font-size:11px;color:#9CA3AF;line-height:1.6;">Valid until ${opts.licenseExpiresAt.toISOString().slice(0, 10)}.</p>` : ''}
            ` : ''}

            ${downloadUrl ? `
                <h3 style="margin:24px 0 8px;font-size:14px;font-weight:800;color:#1E1E1E;letter-spacing:-0.01em;">Download Mero CMS</h3>
                <p style="margin:0 0 16px;font-size:12px;color:#6B7280;line-height:1.6;">Click the button below to download the full source bundle. Inside the .zip you'll find an INSTALL.md with step-by-step instructions for your preferred installation path (Cloud, managed, VPS, or local).</p>
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
                  <tr>
                    <td style="background-color:#1E1E1E;border-radius:8px;">
                      <a href="${downloadUrl}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.03em;">Download Mero CMS →</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:11px;color:#9CA3AF;line-height:1.6;">Or copy and paste this link into your browser:</p>
                <p style="margin:0 0 16px;font-size:11px;color:#6B7280;word-break:break-all;background:#F9FAFB;padding:10px 14px;border-radius:8px;border:1px solid #E5E7EB;">${this.escape(downloadUrl)}</p>
                ${downloadExpiresAt ? `<p style="margin:0 0 24px;font-size:11px;color:#9CA3AF;line-height:1.6;">This download link expires on ${downloadExpiresAt.toISOString().slice(0, 10)}. If it's expired by the time you click, reply to this email with your license key and we'll send you a fresh one.</p>` : ''}
            ` : ''}

            <h3 style="margin:24px 0 8px;font-size:14px;font-weight:800;color:#1E1E1E;letter-spacing:-0.01em;">What's next</h3>
            <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#374151;line-height:1.7;">
                <li>${downloadUrl ? 'Download and unzip the bundle.' : 'You\'ll be redirected to the dashboard automatically.'}</li>
                <li>${downloadUrl ? 'Read <code style="background:#F9FAFB;padding:1px 4px;border-radius:3px;font-size:11px;">docs/customer/INSTALL.md</code> — pick the path that fits your setup.' : 'Log in with the credentials you just created.'}</li>
                <li>Open the setup wizard at <code style="background:#F9FAFB;padding:1px 4px;border-radius:3px;font-size:11px;">/setup</code> and paste your license key when prompted.</li>
            </ol>

            <p style="margin:24px 0 0;font-size:12px;color:#9CA3AF;line-height:1.6;">Order reference: <code style="background:#F9FAFB;padding:1px 4px;border-radius:3px;font-size:11px;">${this.escape(opts.orderId)}</code><br/>If anything goes wrong, reply to this email and we'll help.</p>
        `;

        await this.mailService.sendTemplatedMail(
            opts.customerEmail,
            opts.licenseKey ? 'Your Mero CMS license & download' : 'Your Mero CMS purchase',
            innerHtml,
            opts.licenseKey ? 'Your license key and download link are inside.' : undefined,
        );
        this.logger.log(`Delivered post-purchase email to ${opts.customerEmail} for order ${opts.orderId}`);
    }

    /** Minimal HTML escape to keep injected order details safe inside
        the email template. The template itself is operator-controlled
        but customer fields (name, email) flow through it. */
    private escape(s: string): string {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private tierNameFromPackageId(
        packageId: string | null | undefined,
    ): 'basic' | 'premium' | 'professional' | 'enterprise' | 'custom' | null {
        if (!packageId) return null;
        if (packageId.endsWith('basic')) return 'basic';
        if (packageId.endsWith('premium')) return 'premium';
        if (packageId.endsWith('professional')) return 'professional';
        if (packageId.endsWith('enterprise')) return 'enterprise';
        if (packageId.endsWith('custom')) return 'custom';
        return null;
    }

    private describeItem(input: CreateOrderInput): string {
        switch (input.itemType) {
            case 'package':     return `Mero CMS — ${input.packageId} licence`;
            case 'maintenance': return `Mero CMS — annual maintenance for ${input.packageId}`;
            case 'plugin':      return `Mero CMS plugin — ${input.pluginSlug}`;
            case 'cloud-tier':  return `Mero Cloud — ${input.cloudTierId}`;
            default:            return 'Mero CMS purchase';
        }
    }
}
