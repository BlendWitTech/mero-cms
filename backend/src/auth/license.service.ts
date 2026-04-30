import { Injectable } from '@nestjs/common';
import { Tier, getActiveTier } from './tier.enum';

export interface LicenseStatus {
    valid: boolean;
    tier: Tier;
    domain: string | null;
    seats: number;
    expiresAt: Date | null;
    daysRemaining: number | null;
    error?: string;
}

/**
 * Thin service used by TierGuard to check the active deployment tier.
 *
 * Resolution order (highest priority first):
 *   1. LICENSE_KEY env var — JWT decoded to get tier (e.g. "Enterprise")
 *   2. TIER env var — plain string like "premium"
 *   3. Default: Premium
 */
@Injectable()
export class LicenseService {
    private cached: LicenseStatus | null = null;

    getLicenseStatus(): LicenseStatus {
        if (this.cached) return this.cached;

        // Try to decode tier from LICENSE_KEY JWT first
        const licenseKey = process.env.LICENSE_KEY || '';
        if (licenseKey.startsWith('eyJ')) {
            try {
                const parts = licenseKey.split('.');
                if (parts.length === 3) {
                    const decode = (s: string) =>
                        Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
                    const payload = JSON.parse(decode(parts[1]).toString('utf8'));

                    const notExpired = !payload.exp || payload.exp > Math.floor(Date.now() / 1000);
                    if (notExpired) {
                        const tierName = (payload.tier || '').toLowerCase();
                        const tierMap: Record<string, Tier> = {
                            basic: Tier.Basic,
                            premium: Tier.Premium,
                            professional: Tier.Enterprise,
                            enterprise: Tier.Enterprise,
                            custom: Tier.Custom,
                        };
                        const tier = tierMap[tierName];
                        if (tier !== undefined) {
                            this.cached = {
                                valid: tier > Tier.Basic,
                                tier,
                                domain: payload.domain || null,
                                seats: payload.seats || 999,
                                expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
                                daysRemaining: null,
                            };
                            return this.cached;
                        }
                    }
                }
            } catch {
                // Fall through to TIER env var
            }
        }

        // Fallback: TIER env var
        const tier = getActiveTier();
        this.cached = {
            valid: tier > Tier.Basic,
            tier,
            domain: null,
            seats: 999,
            expiresAt: null,
            daysRemaining: null,
        };
        return this.cached;
    }

    /** Call to clear the cache (e.g. after activating a new license). */
    refresh(): void {
        this.cached = null;
    }

    verifyKey(token: string): { valid: boolean; tier: Tier; error?: string } {
        if (!token || !token.startsWith('eyJ')) {
            return { valid: false, tier: Tier.Basic, error: 'Invalid license format' };
        }

        try {
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Malformed JWT');
            const decode = (s: string) =>
                Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
            const payload = JSON.parse(decode(parts[1]).toString('utf8'));

            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                return { valid: false, tier: Tier.Basic, error: 'License has expired' };
            }

            const tierName = (payload.tier || '').toLowerCase();
            const tierMap: Record<string, Tier> = {
                basic: Tier.Basic,
                premium: Tier.Premium,
                professional: Tier.Enterprise,
                enterprise: Tier.Enterprise,
                custom: Tier.Custom,
            };

            const tier = tierMap[tierName] || Tier.Basic;
            return { valid: true, tier };
        } catch {
            return { valid: false, tier: Tier.Basic, error: 'Could not decode license token' };
        }
    }
}
