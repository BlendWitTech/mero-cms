import { Controller, Get, Post, Body, Sse, UseGuards, BadRequestException, UnauthorizedException, MessageEvent } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { SetupService, OPTIONAL_MODULES, CORE_MODULES, MODULE_LABELS, MODULE_TIERS } from './setup.service';
import { SetupProgressService } from './setup-progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LicenseService } from '../auth/license.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permissions.enum';
import { MailService } from '../mail/mail.service';
import { MediaService } from '../media/media.service';
import { SettingsService } from '../settings/settings.service';

@Controller('setup')
export class SetupController {
    constructor(
        private readonly setupService: SetupService,
        private readonly licenseService: LicenseService,
        private readonly mailService: MailService,
        private readonly mediaService: MediaService,
        private readonly settingsService: SettingsService,
        private readonly progress: SetupProgressService,
    ) { }

    /**
     * Server-Sent Events stream of setup progress.
     *
     * The wizard opens this BEFORE firing /setup/complete so the SSE
     * channel is live when the work starts and no events are missed.
     * NestJS handles the EventSource protocol automatically — we just
     * return an Observable<MessageEvent>.
     *
     * Auth: intentionally open. The wizard has no admin user yet so
     * we can't gate this behind JWT. Once setup is complete the
     * endpoint still works but emits nothing (no caller pushes to
     * the Subject), which is harmless.
     */
    @Sse('progress')
    streamProgress(): Observable<MessageEvent> {
        return this.progress.events$.pipe(
            map((event) => ({
                data: event,
            })),
        );
    }

    @Get('status')
    async getStatus() {
        const complete = await this.setupService.isSetupComplete();
        const database = this.setupService.getDatabaseStatus();
        return {
            setupComplete: complete,
            database,
        };
    }

    @Get('modules')
    async getModules() {
        const status = this.licenseService.getLicenseStatus();
        const optionalWithMeta = OPTIONAL_MODULES.map((key) => ({
            key,
            ...(MODULE_LABELS[key] || { label: key, description: '', group: 'Other' }),
            requiredTier: MODULE_TIERS[key] || 1, // Default to Basic if not mapped
        }));

        return {
            core: CORE_MODULES,
            optional: optionalWithMeta,
            currentTier: status.tier,
            branch: process.env.CMS_BRANCH || 'marketing',
        };
    }

    @Post('verify-license')
    async verifyLicense(@Body() body: { licenseKey: string }) {
        if (!body.licenseKey?.trim()) throw new BadRequestException('licenseKey is required');
        const status = this.licenseService.verifyKey(body.licenseKey);
        if (!status.valid) throw new UnauthorizedException(status.error || 'Invalid license key');
        return { valid: true, tier: status.tier };
    }

    @Get('enabled-modules')
    async getEnabledModules() {
        const modules = await this.setupService.getEnabledModules();
        return { enabledModules: modules };
    }

    @Post('complete')
    async complete(
        @Body() body: {
            siteName: string;
            adminEmail: string;
            adminPassword: string;
            adminName: string;
            enabledModules: string[];
            /** Optional license key collected at the wizard's License step.
                If present and verifies, it's persisted to setup.json. */
            licenseKey?: string;
        },
    ) {
        if (!body.siteName || !body.adminEmail || !body.adminPassword || !body.adminName) {
            throw new BadRequestException('siteName, adminEmail, adminPassword, and adminName are required');
        }
        // If a license key is provided, verify it before persisting so we
        // don't store an invalid key. Empty/missing key is fine — customers
        // running on the free tier or evaluating skip this step.
        if (body.licenseKey?.trim()) {
            const status = this.licenseService.verifyKey(body.licenseKey.trim());
            if (!status.valid) {
                throw new BadRequestException(`Invalid license key: ${status.error || 'rejected'}`);
            }
        }
        return this.setupService.completeSetup(body);
    }

    @Post('modules')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions(Permission.SETTINGS_EDIT)
    async updateModules(@Body() body: { enabledModules: string[] }) {
        return this.setupService.updateEnabledModules(body.enabledModules);
    }

    /**
     * Database setup wizard endpoints.
     *
     * The first-run wizard collects DB connection details from the
     * customer (host / port / user / password / dbname) instead of
     * making them edit `.env`. We test the connection, then write a
     * `setup.json` file that `bootstrapSecrets()` in main.ts reads on
     * subsequent boots to populate `DATABASE_URL`.
     *
     * Provider is fixed to PostgreSQL for now (Prisma generates the
     * client at build time per-provider; multi-provider support
     * requires shipping multiple clients). Future versions can add
     * MySQL by detecting the prefix.
     */
    @Post('database/test')
    async testDatabase(@Body() body: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        ssl?: boolean;
    }) {
        if (!body.host || !body.username || !body.database) {
            throw new BadRequestException('host, username, and database are required');
        }
        return this.setupService.testDatabaseConnection(body);
    }

    @Post('database/save')
    async saveDatabaseConfig(@Body() body: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        ssl?: boolean;
        runMigrations?: boolean;
    }) {
        if (!body.host || !body.username || !body.database) {
            throw new BadRequestException('host, username, and database are required');
        }
        return this.setupService.saveDatabaseConfig(body);
    }

    /**
     * Email setup — wizard's "Email Services" step.
     *
     * `test` validates the customer's typed credentials against the
     * actual provider (SMTP `transporter.verify()` or Resend domain
     * list). `save` writes the canonical `smtp_*` / `resend_*` /
     * `email_provider` settings keys to the DB so MailService picks
     * them up on the next send.
     *
     * Both endpoints are intentionally unauthed because they run
     * during the first-boot wizard, BEFORE the admin user exists.
     * Once setup is complete, all subsequent edits go through the
     * admin Settings → Email Services page (which IS authed).
     */
    @Post('email/test')
    async testEmail(@Body() body: {
        provider?: 'smtp' | 'resend';
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smtpSecure?: boolean;
        resendApiKey?: string;
    }) {
        return this.mailService.testEmailConnection(body);
    }

    @Post('email/save')
    async saveEmail(@Body() body: {
        provider?: 'smtp' | 'resend';
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smtpSecure?: boolean;
        smtpFrom?: string;
        resendApiKey?: string;
    }) {
        // Allow saving without verifying — customers may want to revisit
        // and finish later. Empty strings are intentionally written so
        // partial config doesn't half-leak through.
        const updates: Record<string, string> = {
            email_provider: body.provider || 'smtp',
        };
        if (body.smtpHost !== undefined) updates.smtp_host = body.smtpHost;
        if (body.smtpPort !== undefined) updates.smtp_port = String(body.smtpPort);
        if (body.smtpUser !== undefined) updates.smtp_user = body.smtpUser;
        if (body.smtpPass !== undefined) updates.smtp_pass = body.smtpPass;
        if (body.smtpSecure !== undefined) updates.smtp_secure = String(!!body.smtpSecure);
        if (body.smtpFrom !== undefined) updates.smtp_from = body.smtpFrom;
        if (body.resendApiKey !== undefined) updates.resend_api_key = body.resendApiKey;
        await this.settingsService.updateMany(updates);
        return { success: true };
    }

    /**
     * Storage / media setup — wizard's "Storage" step.
     *
     * `test` does a HeadBucket against the typed credentials. `save`
     * writes `s3_*` and `storage_provider` settings. Choosing 'local'
     * doesn't require a test or any credentials — uploads will land in
     * the backend's `uploads/` directory. Customers running on a
     * single-machine self-host typically pick 'local' and never look
     * at this step again.
     */
    @Post('storage/test')
    async testStorage(@Body() body: {
        accessKey?: string;
        secretKey?: string;
        bucket?: string;
        region?: string;
        endpoint?: string;
    }) {
        return this.mediaService.testS3Connection(body);
    }

    @Post('storage/save')
    async saveStorage(@Body() body: {
        provider?: 'local' | 's3' | 'cloudinary';
        accessKey?: string;
        secretKey?: string;
        bucket?: string;
        region?: string;
        endpoint?: string;
        cloudinaryCloudName?: string;
        cloudinaryApiKey?: string;
        cloudinaryApiSecret?: string;
    }) {
        const updates: Record<string, string> = {
            storage_provider: body.provider || 'local',
        };
        if (body.accessKey !== undefined) updates.s3_access_key = body.accessKey;
        if (body.secretKey !== undefined) updates.s3_secret_key = body.secretKey;
        if (body.bucket !== undefined) updates.s3_bucket = body.bucket;
        if (body.region !== undefined) updates.s3_region = body.region;
        if (body.endpoint !== undefined) updates.s3_endpoint = body.endpoint;
        if (body.cloudinaryCloudName !== undefined) updates.cloudinary_cloud_name = body.cloudinaryCloudName;
        if (body.cloudinaryApiKey !== undefined) updates.cloudinary_api_key = body.cloudinaryApiKey;
        if (body.cloudinaryApiSecret !== undefined) updates.cloudinary_api_secret = body.cloudinaryApiSecret;
        await this.settingsService.updateMany(updates);
        return { success: true };
    }

    /**
     * Site URL setup — wizard's "Site URL" step.
     *
     * Writes the canonical `site_url` setting that public.controller
     * already reads. `media_host` is optional and only relevant for
     * split-domain CDN setups; left empty it auto-derives from
     * site_url at request time.
     */
    @Post('site-url/save')
    async saveSiteUrl(@Body() body: { siteUrl?: string; mediaHost?: string }) {
        const updates: Record<string, string> = {};
        if (body.siteUrl !== undefined) {
            // Strip trailing slash for consistency — themes assume no
            // trailing slash when they concatenate paths.
            updates.site_url = (body.siteUrl || '').trim().replace(/\/+$/, '');
        }
        if (body.mediaHost !== undefined) {
            updates.media_host = (body.mediaHost || '').trim().replace(/\/+$/, '');
        }
        if (Object.keys(updates).length === 0) {
            throw new BadRequestException('siteUrl or mediaHost is required');
        }
        await this.settingsService.updateMany(updates);
        return { success: true };
    }
}
