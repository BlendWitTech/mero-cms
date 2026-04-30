import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Shape returned for ApiKey listing — never includes the raw token. The
 * client only sees the prefix so a user can eyeball which key is which.
 */
export interface ApiKeySummary {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
}

/** Shape returned on CREATE — includes the raw token exactly once. */
export interface CreatedApiKey extends ApiKeySummary {
    token: string;
}

const TOKEN_PREFIX = 'mk_live_';

function hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
    // 32-char base62-ish body; `mk_live_` tag makes the token self-describing.
    return TOKEN_PREFIX + randomBytes(24).toString('base64url');
}

@Injectable()
export class ApiKeysService {
    constructor(private readonly prisma: PrismaService) {}

    /** List keys for a given user, ordered by recency. Never returns the raw token. */
    async list(userId: string): Promise<ApiKeySummary[]> {
        const rows = await (this.prisma as any).apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                prefix: true,
                scopes: true,
                lastUsedAt: true,
                expiresAt: true,
                revokedAt: true,
                createdAt: true,
            },
        });
        return rows as ApiKeySummary[];
    }

    /**
     * Mint a new API key. Returns the full token exactly once; the caller
     * MUST show it to the user immediately and never persist it unhashed.
     */
    async create(
        userId: string,
        input: { name: string; scopes?: string[]; expiresAt?: Date | null },
    ): Promise<CreatedApiKey> {
        const name = (input.name || '').trim();
        if (!name) throw new BadRequestException('API key name is required.');
        if (name.length > 80) throw new BadRequestException('API key name is too long (max 80).');

        const token = generateToken();
        const tokenHash = hash(token);
        const prefix = token.substring(0, 16); // "mk_live_" + first 8 chars

        const row = await (this.prisma as any).apiKey.create({
            data: {
                name,
                tokenHash,
                prefix,
                userId,
                scopes: input.scopes ?? [],
                expiresAt: input.expiresAt ?? null,
            },
        });

        return {
            id: row.id,
            name: row.name,
            prefix: row.prefix,
            scopes: row.scopes,
            lastUsedAt: row.lastUsedAt,
            expiresAt: row.expiresAt,
            revokedAt: row.revokedAt,
            createdAt: row.createdAt,
            token, // <— only time we'll ever return this
        };
    }

    /** Soft-revoke a key. Idempotent; re-revoking is a no-op. */
    async revoke(userId: string, id: string): Promise<ApiKeySummary> {
        const existing = await (this.prisma as any).apiKey.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('API key not found.');
        if (existing.userId !== userId) throw new ForbiddenException('You can only revoke your own keys.');

        const updated = await (this.prisma as any).apiKey.update({
            where: { id },
            data: { revokedAt: existing.revokedAt ?? new Date() },
        });
        return updated as ApiKeySummary;
    }

    /**
     * Validate a bearer token for the ApiKeyAuthGuard. Returns the owning
     * user id and scopes on success; null on any failure (wrong token,
     * revoked, expired). Also bumps `lastUsedAt` on hit.
     */
    async validate(
        token: string,
    ): Promise<{ userId: string; scopes: string[] } | null> {
        if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
        const tokenHash = hash(token);
        const row = await (this.prisma as any).apiKey.findUnique({ where: { tokenHash } });
        if (!row) return null;
        if (row.revokedAt) return null;
        if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

        // Bump lastUsedAt — intentionally async/ignored-error so validation
        // stays fast even under write pressure.
        (this.prisma as any).apiKey
            .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
            .catch(() => {});

        return { userId: row.userId, scopes: row.scopes };
    }
}
