import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export const WEBHOOK_EVENTS = [
    'post.published',
    'post.updated',
    'post.deleted',
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
        // Derive a stable 32-byte key from the app secret so webhook secrets
        // are encrypted at rest. Changing WEBHOOK_SECRET_KEY will break existing
        // encrypted secrets — rotate carefully.
        const seed = process.env.WEBHOOK_SECRET_KEY || process.env.JWT_SECRET || 'change-me-in-production';
        this.encKey = crypto.createHash('sha256').update(seed).digest();
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
        const rows = await (this.prisma as any).webhook.findMany({ orderBy: { createdAt: 'desc' } });
        return rows.map((wh: any) => this.redact(wh));
    }

    async findOne(id: string) {
        const wh = await (this.prisma as any).webhook.findUnique({ where: { id } });
        if (!wh) throw new NotFoundException(`Webhook ${id} not found`);
        return this.redact(wh);
    }

    /** Replace the stored secret with a boolean so the frontend knows one is set without seeing it. */
    private redact(wh: any) {
        const { secret, ...rest } = wh;
        return { ...rest, hasSecret: !!secret };
    }

    async create(dto: { name: string; url: string; events: string[]; secret?: string; isActive?: boolean }) {
        this.validateWebhookUrl(dto.url);
        const data = { ...dto };
        if (data.secret) data.secret = this.encrypt(data.secret);
        return (this.prisma as any).webhook.create({ data });
    }

    async update(id: string, dto: Partial<{ name: string; url: string; events: string[]; secret: string; isActive: boolean }>) {
        await this.findOne(id);
        if (dto.url) this.validateWebhookUrl(dto.url);
        const data = { ...dto };
        if (data.secret) data.secret = this.encrypt(data.secret);
        return (this.prisma as any).webhook.update({ where: { id }, data });
    }

    /**
     * Reject webhook URLs that point to internal / private infrastructure (SSRF protection).
     * Only HTTPS is permitted in production to avoid plaintext interception.
     */
    private validateWebhookUrl(url: string): void {
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
            /^fc[0-9a-f][0-9a-f]:/i, // IPv6 unique local
            /^fe[89ab][0-9a-f]:/i,   // IPv6 link-local
        ];

        if (blockedPatterns.some(r => r.test(host))) {
            throw new BadRequestException('Webhook URL points to a private or internal address');
        }
    }

    async remove(id: string) {
        await this.findOne(id);
        return (this.prisma as any).webhook.delete({ where: { id } });
    }

    /**
     * Fire all active webhooks that are subscribed to the given event.
     * Called internally by other services after content mutations.
     */
    async dispatch(event: WebhookEvent, payload: Record<string, any>) {
        const webhooks = await (this.prisma as any).webhook.findMany({
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
