import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { Tier } from './tier.enum';

export interface LicensePayload {
    tier: keyof typeof Tier;
    domain: string;
    seats: number;
    iat: number;
    exp: number;
}

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
 * Public RSA key used to verify LICENSE_KEY JWTs issued by Blendwit.
 * The matching private key is held by Blendwit internally and never ships with the CMS.
 */
const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2zm3BewPm8SVZ4kUA1o0
4sFlLPe32E4bHq7O8yGFCiSoS8Xc8nh/fToj6UUvZQjRKU/yaWwE/sjrMRyQCIMC
TAnParIepW0Fr+XSfgSrrwethYrw9bY0Z/Uj9R0JAk45KVpQRfXSwKHjiAwgt3+M
6Dvu6HuME4PJt/Km3Svm21gOlBjPZ5MWn7r8z6KllJvnpdSW8DRQEw4AsQZdSdgy
o5ZLv6nFoB6Tu0VzTFnj21ZzB7+JF7B75UCrP+eB/KIJ6i5KEbCNzpE5oU26LURA
SJo/ZFxSxfEAC52zYIy5SUhmOi1cFugPVLF1pbXZfKyDJG02inc7ZMDNLp6NkF1e
/wIDAQAB
-----END PUBLIC KEY-----`;

/** Split a base64url-encoded JWT into its three parts and decode each. */
function parseJwt(token: string): { header: any; payload: any; signature: Buffer; signingInput: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed JWT');

    const decode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    return {
        header: JSON.parse(decode(parts[0]).toString('utf8')),
        payload: JSON.parse(decode(parts[1]).toString('utf8')),
        signature: decode(parts[2]),
        signingInput: `${parts[0]}.${parts[1]}`,
    };
}

@Injectable()
export class LicenseService {
    private readonly logger = new Logger(LicenseService.name);
    private cached: LicenseStatus | null = null;

    /**
     * Parse and verify the LICENSE_KEY env var.
     * Result is cached for the lifetime of the process — call refresh() to re-read.
     */
    getLicenseStatus(): LicenseStatus {
        if (this.cached) return this.cached;
        this.cached = this.verify();
        return this.cached;
    }

    /** Force re-verification (e.g. after a settings change). */
    refresh(): void {
        this.cached = null;
    }

    private verify(): LicenseStatus {
        const key = process.env.LICENSE_KEY;

        if (!key) {
            this.logger.warn('LICENSE_KEY not set — running as Basic (unlicensed)');
            return this.unlicensed('LICENSE_KEY not configured');
        }

        try {
            const { header, payload, signature, signingInput } = parseJwt(key);

            // Only RS256 is accepted
            if (header.alg !== 'RS256') {
                return this.unlicensed(`Unsupported algorithm: ${header.alg}`);
            }

            // Verify RSA signature
            const verify = crypto.createVerify('SHA256');
            verify.update(signingInput);
            const valid = verify.verify(LICENSE_PUBLIC_KEY, signature);

            if (!valid) {
                this.logger.warn('LICENSE_KEY signature invalid');
                return this.unlicensed('Invalid license signature');
            }

            // Check expiry
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                this.logger.warn('LICENSE_KEY expired');
                return this.unlicensed('License has expired', payload);
            }

            const tier = Tier[payload.tier as keyof typeof Tier] ?? Tier.Basic;
            const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
            const daysRemaining = expiresAt
                ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
                : null;

            this.logger.log(`License valid — tier: ${payload.tier}, domain: ${payload.domain}, seats: ${payload.seats}`);

            return {
                valid: true,
                tier,
                domain: payload.domain ?? null,
                seats: payload.seats ?? 1,
                expiresAt,
                daysRemaining,
            };
        } catch (err: any) {
            this.logger.error(`License verification error: ${err.message}`);
            return this.unlicensed(`Verification error: ${err.message}`);
        }
    }

    private unlicensed(error: string, payload?: any): LicenseStatus {
        return {
            valid: false,
            tier: Tier.Basic,
            domain: payload?.domain ?? null,
            seats: 1,
            expiresAt: payload?.exp ? new Date(payload.exp * 1000) : null,
            daysRemaining: null,
            error,
        };
    }
}
