import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as dns from 'dns';
import * as net from 'net';
import { promisify } from 'util';

const dnsLookupAll = promisify(dns.lookup) as unknown as (
    hostname: string,
    options: { all: true },
) => Promise<Array<{ address: string; family: number }>>;

export const WEBHOOK_EVENTS = [
    'post.published',
    'post.updated',
    'post.deleted',
    'page.published',
    'page.updated',
    'page.deleted',
    'lead.created',
    'form.submission',
    'theme.activated',
    'settings.updated',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);
    private readonly encKey: Buffer;

    constructor(private prisma: PrismaService) {
        // Derive a stable 32-byte key from WEBHOOK_SECRET_KEY so webhook
        // secrets are encrypted at rest. Presence is enforced at boot by
        // assertRequiredSecrets() in main.ts — no fallbacks here, since
        // silently reusing JWT_SECRET or a hardcoded literal would encrypt
        // every customer's webhook secrets with the same key.
        //
        // Rotating WEBHOOK_SECRET_KEY breaks existing encrypted secrets —
        // re-enter each webhook's secret after rotation.
        if (!process.env.WEBHOOK_SECRET_KEY) {
            throw new Error('WEBHOOK_SECRET_KEY is required — refusing to initialise WebhooksService.');
        }
        this.encKey = crypto.createHash('sha256').update(process.env.WEBHOOK_SECRET_KEY).digest();
    }

    /** Encrypt a plaintext secret using AES-256-GCM. Returns "enc:<iv>:<tag>:<data>". */
    private encrypt(plain: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);
        const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    /** Decrypt an "enc:…" value. Returns plaintext strings unchanged (backwards-compat). */
    private decrypt(value: string): string {
        if (!value || !value.startsWith('enc:')) return value;
        const parts = value.split(':');
        if (parts.length !== 4) return value;
        const [, ivHex, tagHex, dataHex] = parts;
        try {
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            const data = Buffer.from(dataHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', this.encKey, iv);
            decipher.setAuthTag(tag);
            return decipher.update(data).toString('utf8') + decipher.final('utf8');
        } catch {
            this.logger.warn('Failed to decrypt webhook secret — returning raw value');
            return value;
        }
    }

    async findAll() {
        const rows = await this.prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
        return rows.map((wh: any) => this.redact(wh));
    }

    async findOne(id: string) {
        const wh = await this.prisma.webhook.findUnique({ where: { id } });
        if (!wh) throw new NotFoundException(`Webhook ${id} not found`);
        return this.redact(wh);
    }

    /** Replace the stored secret with a boolean so the frontend knows one is set without seeing it. */
    private redact(wh: any) {
        const { secret, ...rest } = wh;
        return { ...rest, hasSecret: !!secret };
    }

    async create(dto: { name: string; url: string; events: string[]; secret?: string; isActive?: boolean }) {
        await this.validateWebhookUrl(dto.url);
        const data = { ...dto };
        if (data.secret) data.secret = this.encrypt(data.secret);
        return this.prisma.webhook.create({ data });
    }

    async update(id: string, dto: Partial<{ name: string; url: string; events: string[]; secret: string; isActive: boolean }>) {
        await this.findOne(id);
        if (dto.url) await this.validateWebhookUrl(dto.url);
        const data = { ...dto };
        if (data.secret) data.secret = this.encrypt(data.secret);
        return this.prisma.webhook.update({ where: { id }, data });
    }

    /**
     * Reject webhook URLs that point to internal / private infrastructure (SSRF protection).
     * Only HTTPS is permitted in production to avoid plaintext interception.
     *
     * Runs the blocklist against both (a) the raw hostname as typed by the
     * user and (b) every IP the hostname resolves to. Without the DNS check,
     * a public hostname with an A-record pointing at 127.0.0.1 (or the cloud
     * metadata endpoint 169.254.169.254) would slip through.
     */
    private async validateWebhookUrl(url: string): Promise<void> {
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            throw new BadRequestException('Invalid webhook URL');
        }

        if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
            throw new BadRequestException('Webhook URL must use HTTPS');
        }

        const host = parsed.hostname.toLowerCase();
        if (this.isBlockedHost(host)) {
            throw new BadRequestException('Webhook URL points to a private or internal address');
        }

        // If the hostname is already a literal IP, the hostname check above
        // already covered it.
        if (net.isIP(host)) return;

        // Resolve DNS and re-check every answer. dns.lookup goes through
        // the OS resolver so /etc/hosts entries and CNAMEs are honoured.
        let addrs: Array<{ address: string; family: number }> = [];
        try {
            addrs = await dnsLookupAll(host, { all: true });
        } catch {
            throw new BadRequestException(`Cannot resolve webhook host "${host}"`);
        }

        for (const { address } of addrs) {
            if (this.isBlockedHost(address.toLowerCase())) {
                throw new BadRequestException(
                    `Webhook host "${host}" resolves to a private or internal address (${address})`,
                );
            }
        }
    }

    /** Regex blocklist shared by the hostname check and the DNS re-check. */
    private isBlockedHost(host: string): boolean {
        const blockedPatterns = [
            /^localhost$/,
            /^127\./,
            /^0\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[01])\./,
            /^192\.168\./,
            /^169\.254\./, // link-local / cloud metadata (AWS 169.254.169.254)
            /^100\.64\./, // shared address space RFC 6598
            /^::1$/,
            /^::$/, // IPv6 unspecified
            /^fc[0-9a-f][0-9a-f]:/i, // IPv6 unique local
            /^fe[89ab][0-9a-f]:/i,   // IPv6 link-local
            /^::ffff:127\./i,         // IPv4-mapped loopback
            /^::ffff:10\./i,          // IPv4-mapped RFC1918
            /^::ffff:192\.168\./i,
            /^::ffff:169\.254\./i,
        ];
        return blockedPatterns.some(r => r.test(host));
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.webhook.delete({ where: { id } });
    }

    /**
     * Fire all active webhooks that are subscribed to the given event.
     * Called internally by other services after content mutations.
     */
    async dispatch(event: WebhookEvent, payload: Record<string, any>) {
        const webhooks = await this.prisma.webhook.findMany({
            where: { isActive: true },
        });

        for (const wh of webhooks) {
            if (!wh.events.includes(event) && !wh.events.includes('*')) continue;
            this.send(wh, event, payload).catch(err =>
                this.logger.error(`Webhook ${wh.id} delivery failed: ${err.message}`),
            );
        }
    }

    private async send(webhook: any, event: string, payload: Record<string, any>) {
        const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (webhook.secret) {
            const plainSecret = this.decrypt(webhook.secret);
            const sig = crypto.createHmac('sha256', plainSecret).update(body).digest('hex');
            headers['X-Webhook-Signature'] = `sha256=${sig}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const res = await fetch(webhook.url, { method: 'POST', headers, body, signal: controller.signal });
            this.logger.log(`Webhook ${webhook.id} → ${event}: HTTP ${res.status}`);
        } finally {
            clearTimeout(timeout);
        }
    }
}
