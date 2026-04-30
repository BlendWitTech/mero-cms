import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Keys (or key prefixes) whose writes are audit-logged and whose *values* are
 * redacted in the log — SMTP passwords, API credentials, etc. If the key
 * itself is sensitive but not secret (e.g. smtp_host), we log the value.
 */
const SENSITIVE_KEY_PREFIXES = [
    'smtp_',
    'license_',
    'whitelabel_',
    'admin_',       // dashboard branding
    'cms_',         // CMS branding (cms_title, cms_logo)
    'security_',    // lockout, 2FA enforcement, session locking, etc.
    'lockout_',     // lockout_threshold, lockout_duration
];
const SECRET_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /token/i,
    /smtp_pass/i,
];

function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PREFIXES.some(p => key.startsWith(p));
}

function redactValue(key: string, value: string): string {
    if (SECRET_KEY_PATTERNS.some(r => r.test(key))) return '***REDACTED***';
    // Truncate very long values so the audit log stays readable.
    if (value && value.length > 200) return value.slice(0, 200) + '…';
    return value;
}

@Injectable()
export class SettingsService {
    constructor(
        private prisma: PrismaService,
        private webhooksService: WebhooksService,
        private auditLogService: AuditLogService,
    ) { }

    async findAll() {
        const settings = await (this.prisma as any).setting.findMany();
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    }

    /**
     * Resolve the canonical public site URL.
     *
     * Resolution order — DB setting wins because that's what the admin
     * configures via Settings → Branding (or the wizard's Site URL
     * step). The `NEXT_PUBLIC_SITE_URL` / `APP_URL` / `FRONTEND_URL`
     * env vars are kept as fallbacks for env-driven deploys (Docker,
     * Railway) where the customer hasn't logged into the admin yet
     * and prefers env-only config. Localhost is the last-ditch default
     * for fresh installs that haven't completed setup.
     *
     * Used by services that produce externally-visible URLs:
     *   - sitemap, robots — XML feeds need absolute URLs.
     *   - mail templates — links inside transactional emails.
     *   - invitations — "click here to join" URLs.
     *   - public site-data — themes consume this for canonical tags.
     *
     * Cached for 30s so back-to-back calls (e.g. building a sitemap
     * with hundreds of URL entries) don't hammer the settings table.
     * Cache is invalidated on any settings update via clearSiteUrlCache.
     */
    private siteUrlCache: { value: string; expiresAt: number } | null = null;
    async getSiteUrl(): Promise<string> {
        if (this.siteUrlCache && Date.now() < this.siteUrlCache.expiresAt) {
            return this.siteUrlCache.value;
        }
        const row = await (this.prisma as any).setting.findUnique({
            where: { key: 'site_url' },
        }).catch(() => null);
        const fromDb = (row?.value || '').trim().replace(/\/+$/, '');
        const fromEnv = (
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.APP_URL ||
            process.env.FRONTEND_URL ||
            ''
        ).trim().replace(/\/+$/, '');
        const resolved = fromDb || fromEnv || 'http://localhost:3000';
        this.siteUrlCache = { value: resolved, expiresAt: Date.now() + 30_000 };
        return resolved;
    }

    /** Drop the cached site URL — called from updateMany when site_url changes. */
    clearSiteUrlCache() {
        this.siteUrlCache = null;
    }

    async update(key: string, value: string, actorUserId?: string) {
        const existing = await (this.prisma as any).setting.findUnique({ where: { key } });
        const result = await (this.prisma as any).setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        if (isSensitiveKey(key) && actorUserId) {
            const oldValue = existing?.value ?? null;
            const changed = oldValue !== value;
            if (changed) {
                await this.auditLogService.log(
                    actorUserId,
                    'SETTINGS_UPDATE',
                    {
                        key,
                        oldValue: oldValue === null ? null : redactValue(key, oldValue),
                        newValue: redactValue(key, value),
                    },
                    'WARNING',
                ).catch(() => { /* audit failure must not block the write */ });
            }
        }

        return result;
    }

    async updateMany(settings: Record<string, string>, actorUserId?: string) {
        const updates = Object.entries(settings).map(([key, value]) =>
            this.update(key, value, actorUserId),
        );
        const result = await Promise.all(updates);
        // Drop the in-memory site URL cache when site_url or media_host
        // changes — otherwise services like sitemap/robots/invitations
        // could keep emitting the old URL for up to 30s.
        if ('site_url' in settings || 'media_host' in settings) {
            this.clearSiteUrlCache();
        }
        this.webhooksService.dispatch('settings.updated', { keys: Object.keys(settings) }).catch(() => { });
        return result;
    }

    async clearThemeCache() {
        const themeUrl = process.env.THEME_URL || 'http://localhost:3002';
        const secret = process.env.REVALIDATE_SECRET || '';
        const url = `${themeUrl}/api/revalidate`;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: secret ? { 'x-revalidate-secret': secret } : {},
            });
            if (!res.ok) {
                const body = await res.text();
                throw new Error(`Theme responded with ${res.status}: ${body}`);
            }
            return { success: true, message: 'Theme cache cleared successfully.' };
        } catch (err: any) {
            throw new Error(`Failed to clear theme cache: ${err.message}`);
        }
    }
}
