import { Controller, Get, Body, Patch, Post, UseGuards, BadRequestException, ForbiddenException, Inject, forwardRef, Request } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SettingsService } from './settings.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { PackagesService } from '../packages/packages.service';
import { PackageEnforcementGuard } from '../packages/package-enforcement.guard';
import { RequireLimit, PackageLimit } from '../packages/require-limit.decorator';
import { getCapabilities } from '../config/packages';

const ADMIN_BRANDING_KEYS = [
    'admin_primary_color',
    'admin_accent_color',
    'admin_heading_font',
    'admin_body_font',
    'admin_logo_url',
    'admin_sidebar_style',
] as const;

const WHITE_LABEL_KEYS = [
    'whitelabel_hide_powered_by',
    'whitelabel_footer_text',
] as const;

type AdminBrandingKey = typeof ADMIN_BRANDING_KEYS[number];

function pickAdminBranding(input: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const key of ADMIN_BRANDING_KEYS) {
        if (input[key] !== undefined) out[key] = input[key];
    }
    return out;
}

function hasAdminBrandingKey(input: Record<string, string>): boolean {
    return Object.keys(input).some((k) => (ADMIN_BRANDING_KEYS as readonly string[]).includes(k));
}

function hasWhiteLabelKey(input: Record<string, string>): boolean {
    return Object.keys(input).some((k) => (WHITE_LABEL_KEYS as readonly string[]).includes(k));
}

@Controller('settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
        @Inject(forwardRef(() => MailService)) private readonly mailService: MailService,
        @Inject(forwardRef(() => PackagesService)) private readonly packagesService: PackagesService,
    ) { }

    /**
     * Authenticated settings read. The full KV store includes SMTP creds,
     * license hints, package id, whitelabel + admin-branding flags, etc.,
     * so it must not be publicly readable. Theme apps that need
     * public-safe settings (site_title, primary_color, etc.) should call
     * `/public/site-data` instead — that endpoint returns a filtered view.
     */
    @Get()
    @SkipThrottle()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_VIEW)
    findAll() {
        // Already gated by JwtAuthGuard + SETTINGS_VIEW; the admin
        // SettingsContext fetches this on every provider mount (plus
        // dev-HMR remounts), which legitimately exceeds the global
        // 300/min cap during active editing. Rate-limiting a read that
        // has two permission checks in front of it adds no security.
        return this.settingsService.findAll();
    }

    /**
     * Generic settings update. Admin dashboard branding keys (admin_*) require
     * the DASHBOARD_BRANDING capability; a Basic-tier caller cannot sneak them
     * through this endpoint. The dedicated /settings/admin-branding endpoint
     * below is preferred for the admin UI.
     */
    @Patch()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async updateMany(@Body() settings: Record<string, string>, @Request() req: any) {
        if (hasAdminBrandingKey(settings)) {
            const usage = await this.packagesService.getUsage();
            const caps = getCapabilities(usage?.package?.id);
            if (!caps.dashboardBranding) {
                throw new ForbiddenException(
                    'Admin dashboard branding (admin_* keys) is only available on the Organizational Enterprise plan.',
                );
            }
        }
        // Gate white-label keys behind the hasWhiteLabel flag — prevents a
        // Premium caller from silently flipping `whitelabel_hide_powered_by`
        // through the generic PATCH endpoint.
        if (hasWhiteLabelKey(settings)) {
            const usage = await this.packagesService.getUsage();
            if (!usage?.limits?.hasWhiteLabel) {
                throw new ForbiddenException(
                    'White-label options are only available on Personal Custom, Org Enterprise, and Org Custom plans.',
                );
            }
        }
        return this.settingsService.updateMany(settings, req.user?.id);
    }

    /**
     * Dedicated admin-branding endpoint. Gated by DASHBOARD_BRANDING so only
     * tiers with dashboardBranding === true can hit it (Org Enterprise + Custom).
     */
    @Patch('admin-branding')
    @UseGuards(JwtAuthGuard, PermissionsGuard, PackageEnforcementGuard)
    @RequireLimit(PackageLimit.DASHBOARD_BRANDING)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async updateAdminBranding(@Body() body: Record<string, string>, @Request() req: any) {
        const filtered = pickAdminBranding(body);
        if (Object.keys(filtered).length === 0) {
            throw new BadRequestException(
                `No admin branding keys provided. Accepted keys: ${ADMIN_BRANDING_KEYS.join(', ')}`,
            );
        }
        return this.settingsService.updateMany(filtered, req.user?.id);
    }

    @Post('clear-theme-cache')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async clearThemeCache() {
        try {
            return await this.settingsService.clearThemeCache();
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Failed to clear theme cache');
        }
    }

    @Post('test-email')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async testEmail(@Body() body: { to: string }) {
        try {
            await this.mailService.sendTemplatedMail(
                body.to,
                'SMTP Test — Mero CMS',
                `<h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1E1E1E;">SMTP Working!</h2>
                 <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">Your email configuration is correctly set up. Emails from the system will be delivered to your recipients.</p>
                 <p style="margin:0;font-size:12px;color:#9CA3AF;">Sent from Mero CMS · System Settings</p>`,
                'Your SMTP configuration is working correctly.',
            );
            return { success: true, message: `Test email sent to ${body.to}` };
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Failed to send test email');
        }
    }
}
