import { Inject, Injectable, BadRequestException, NotFoundException, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SaasLicenseService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => SettingsService)) private settingsService: SettingsService,
    ) {}

    /**
     * Returns the stable instance ID for this CMS installation.
     * Created once on first call and persisted in the Setting table.
     */
    async getInstanceId(): Promise<string> {
        const settings = await this.settingsService.findAll();
        if (settings['instance_id']) return settings['instance_id'];
        const id = `${os.hostname()}-${randomUUID()}`;
        await this.settingsService.update('instance_id', id);
        return id;
    }

    /**
     * Activate a license from a JWT token.
     * Binds the license to this CMS instance — rejects if already bound elsewhere.
     */
    async activateLicense(token: string) {
        if (!token || !token.startsWith('eyJ')) {
            throw new BadRequestException('Invalid license format. Paste your JWT license token.');
        }

        let payload: any;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Malformed JWT');
            const decode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
            payload = JSON.parse(decode(parts[1]).toString('utf8'));
        } catch {
            throw new BadRequestException('Could not read license token. Make sure you copied the full token.');
        }

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            throw new BadRequestException('This license token has expired.');
        }

        const tier: string = (payload.tier || '').toLowerCase();
        const packageId = this.tierToPackageId(tier);
        if (!packageId) {
            throw new BadRequestException(`Unrecognized license tier: "${payload.tier}".`);
        }

        const pkg = await (this.prisma as any).package.findUnique({ where: { id: packageId } });
        if (!pkg) throw new NotFoundException(`Package "${packageId}" is no longer in the database.`);

        // Single-instance enforcement: check if this license is bound to a different instance
        const instanceId = await this.getInstanceId();
        const settings = await this.settingsService.findAll();
        const storedKey = settings['license_key'] || '';
        const boundInstanceId = settings['license_bound_instance'] || '';

        if (storedKey && storedKey !== token && boundInstanceId && boundInstanceId !== instanceId) {
            throw new BadRequestException(
                'This CMS instance already has an active license bound to it. ' +
                'To activate a new license, please deactivate the current one first, or contact support.'
            );
        }

        await this.settingsService.update('active_package_id', packageId);
        await this.settingsService.update('license_key', token);
        await this.settingsService.update('license_activated_at', new Date().toISOString());
        await this.settingsService.update('license_bound_instance', instanceId);

        return {
            success: true,
            message: `Activated ${payload.tier} plan — ${payload.seats ?? '∞'} seats, domain: ${payload.domain ?? '*'}`,
            package: pkg,
        };
    }

    /** Directly switch the active package without a license token (admin override). */
    async setActivePackage(packageId: string) {
        const pkg = await (this.prisma as any).package.findUnique({ where: { id: packageId } });
        if (!pkg) throw new NotFoundException(`Package "${packageId}" not found`);
        await this.settingsService.update('active_package_id', packageId);
        await this.settingsService.update('license_activated_at', new Date().toISOString());
        return { success: true, message: `Switched to ${pkg.name} plan`, package: pkg };
    }

    async getLicenseInfo() {
        const settings = await this.settingsService.findAll();
        const instanceId = await this.getInstanceId();

        // Resolve package ID — DB setting takes priority, then LICENSE_KEY env var
        let packageId: string = settings['active_package_id'] || '';

        // If no DB setting, try to decode LICENSE_KEY from environment
        const envKey = process.env.LICENSE_KEY || '';
        let envTokenInfo: { tier?: string; domain?: string; seats?: number; expiresAt?: string } = {};
        if (!packageId && envKey.startsWith('eyJ')) {
            try {
                const parts = envKey.split('.');
                const decode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
                const pl = JSON.parse(decode(parts[1]).toString('utf8'));
                const notExpired = !pl.exp || pl.exp > Math.floor(Date.now() / 1000);
                if (notExpired) {
                    const tier = (pl.tier || '').toLowerCase();
                    packageId = this.tierToPackageId(tier) || 'personal-basic';
                    envTokenInfo = {
                        tier: pl.tier,
                        domain: pl.domain,
                        seats: pl.seats,
                        expiresAt: pl.exp ? new Date(pl.exp * 1000).toISOString() : undefined,
                    };
                }
            } catch {}
        }

        if (!packageId) packageId = 'personal-basic';

        const pkg = await (this.prisma as any).package.findUnique({ where: { id: packageId } });

        // Decode stored JWT for display info
        let tokenInfo: { tier?: string; domain?: string; seats?: number; expiresAt?: string } = envTokenInfo;
        const storedKey: string = settings['license_key'] || envKey || '';
        if (storedKey.startsWith('eyJ') && storedKey !== envKey) {
            try {
                const decode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
                const pl = JSON.parse(decode(storedKey.split('.')[1]).toString('utf8'));
                tokenInfo = {
                    tier: pl.tier,
                    domain: pl.domain,
                    seats: pl.seats,
                    expiresAt: pl.exp ? new Date(pl.exp * 1000).toISOString() : undefined,
                };
            } catch {}
        }

        const boundInstance = settings['license_bound_instance'] || null;
        const instanceBound = !!boundInstance;
        const instanceMatches = !boundInstance || boundInstance === instanceId;

        return {
            key: storedKey || null,
            activatedAt: settings['license_activated_at'] || null,
            package: pkg,
            tier: pkg?.tier || 1,
            tierName: tokenInfo.tier || (pkg ? pkg.name : 'Basic'),
            instanceId,
            instanceBound,
            instanceValid: instanceMatches,
            ...tokenInfo,
        };
    }

    /** Deactivate the current license, freeing this instance to activate a new one. */
    async deactivateLicense() {
        await this.settingsService.update('license_key', '');
        await this.settingsService.update('license_bound_instance', '');
        await this.settingsService.update('active_package_id', 'personal-basic');
        return { success: true, message: 'License deactivated. This instance is now unbound.' };
    }

    private tierToPackageId(tier: string): string | null {
        const map: Record<string, string> = {
            'basic': 'org-basic',
            'premium': 'org-premium',
            'professional': 'personal-professional',
            'enterprise': 'org-enterprise',
            'custom': 'org-custom',
        };
        return map[tier] || null;
    }

    /**
     * Sign a license JWT after a successful purchase. Counterpart to
     * the verify path that already exists upstream.
     *
     * Token shape (matches what verifyKey() expects):
     *   {
     *     sub: customerEmail,
     *     tier: 'premium' | 'enterprise' | …  (string)
     *     packageId: 'personal-premium' | …
     *     domain?: string,            // optional, only for cloud customers
     *     seats?: number,
     *     iat: <unix>,
     *     exp: <unix>                  // 1 year from now by default
     *   }
     *
     * Signed with the same JWT_SECRET that protects auth tokens. Yes,
     * that overloads one secret across two purposes — fine for the
     * self-hosted deployment where there's only one instance signing
     * its own licenses. A multi-instance license server would split
     * these into different keys.
     */
    signLicense(opts: {
        customerEmail: string;
        packageId: string;
        tier: 'basic' | 'premium' | 'professional' | 'enterprise' | 'custom';
        domain?: string;
        seats?: number;
        /** Expiry as ISO date string. Defaults to 1 year from issue. */
        expiresAt?: string;
    }): { token: string; expiresAt: string } {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require('crypto');
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET not set; cannot sign license');

        const issuedAt = Math.floor(Date.now() / 1000);
        const expIso = opts.expiresAt || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
        const exp = Math.floor(new Date(expIso).getTime() / 1000);

        const payload: Record<string, any> = {
            sub: opts.customerEmail,
            tier: opts.tier,
            packageId: opts.packageId,
            iat: issuedAt,
            exp,
        };
        if (opts.domain) payload.domain = opts.domain;
        if (opts.seats !== undefined) payload.seats = opts.seats;

        const b64url = (input: Buffer | string) =>
            Buffer.from(input)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/g, '');

        const headerEncoded = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payloadEncoded = b64url(JSON.stringify(payload));
        const signingInput = `${headerEncoded}.${payloadEncoded}`;
        const signature = crypto
            .createHmac('sha256', secret)
            .update(signingInput)
            .digest();
        const signatureEncoded = b64url(signature);

        return {
            token: `${signingInput}.${signatureEncoded}`,
            expiresAt: expIso,
        };
    }
}
