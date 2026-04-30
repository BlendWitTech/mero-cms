import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as AdmZip from 'adm-zip';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

/**
 * Download bundle service — generates and serves the source tree as a
 * downloadable .zip file to customers who completed a paid order.
 *
 * **Why download tokens, not /downloads/:orderId:**
 *   Anyone who knows an order ID would be able to download otherwise.
 *   We sign a short HMAC token (orderId + expiry) using the same
 *   JWT_SECRET that protects everything else, and only that token
 *   resolves to a download. Tokens default to 30 days because:
 *
 *     - Long enough that customers can come back to the email when
 *       they're actually ready to install on a server.
 *     - Short enough that a leaked token has bounded blast radius.
 *     - Customers can request a new token any time — see the
 *       /downloads/refresh endpoint on the controller.
 *
 * **Bundle contents:**
 *   The full source tree excluding everything that's either secret
 *   (env files, secrets.json, setup.json), regenerable (node_modules,
 *   build outputs, .next), or transient (uploads, .git, OS junk).
 *   Customer untars and runs `npm run setup` + `npm run dev:all` from
 *   the extracted directory — same flow as a `git clone`.
 *
 *   Set `MERO_RELEASE_BUNDLE_PATH` to a pre-built .zip if you'd rather
 *   serve a sealed release than generate on the fly. This is the
 *   recommended path for production — pre-tag a versioned bundle in
 *   CI and point the env var at it.
 */

interface DownloadTokenPayload {
    orderId: string;
    /** Unix seconds. We use seconds to keep tokens compact. */
    exp: number;
    /** Random nonce — makes each token unique even for the same order. */
    nonce: string;
}

const TOKEN_DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class DownloadsService {
    private readonly logger = new Logger(DownloadsService.name);

    constructor(
        private prisma: PrismaService,
        private settings: SettingsService,
    ) {}

    /**
     * Mint a signed download token for a paid order. The token is a
     * compact "<base64url payload>.<base64url signature>" string —
     * lighter than a full JWT and we don't need JWT's claims schema
     * for what is effectively a one-purpose URL signer.
     *
     * Throws if the order doesn't exist or hasn't been paid yet.
     * Plugin / cloud-tier orders don't get a download token because
     * they don't ship source — only package + maintenance orders do.
     */
    async issueToken(orderId: string, ttlSeconds = TOKEN_DEFAULT_TTL_SECONDS): Promise<{ token: string; expiresAt: Date }> {
        const order = await (this.prisma as any).order.findUnique({
            where: { id: orderId },
        });
        if (!order) throw new NotFoundException(`Order ${orderId} not found.`);
        if (order.status !== 'paid') {
            throw new BadRequestException(`Order ${orderId} is not paid (status: ${order.status}).`);
        }
        if (order.itemType !== 'package' && order.itemType !== 'maintenance') {
            throw new BadRequestException(
                `Order ${orderId} is for "${order.itemType}", which doesn't include a source download.`,
            );
        }

        const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
        const payload: DownloadTokenPayload = {
            orderId,
            exp,
            nonce: crypto.randomBytes(8).toString('hex'),
        };
        const token = this.signPayload(payload);
        return { token, expiresAt: new Date(exp * 1000) };
    }

    /**
     * Verify a token and return the orderId it signs for. Throws
     * BadRequestException for any invalid signature, malformed
     * payload, or expired token.
     */
    verifyToken(token: string): { orderId: string; expiresAt: Date } {
        const [b64Payload, b64Sig] = token.split('.');
        if (!b64Payload || !b64Sig) {
            throw new BadRequestException('Malformed download token.');
        }
        const expectedSig = this.hmac(b64Payload);
        // Constant-time comparison to avoid timing oracles.
        const sigBuf = Buffer.from(b64Sig, 'base64url');
        const expBuf = Buffer.from(expectedSig, 'base64url');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            throw new BadRequestException('Invalid download token signature.');
        }
        let payload: DownloadTokenPayload;
        try {
            payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
        } catch {
            throw new BadRequestException('Could not parse download token payload.');
        }
        if (!payload.orderId || !payload.exp) {
            throw new BadRequestException('Download token missing required fields.');
        }
        if (Date.now() / 1000 > payload.exp) {
            throw new BadRequestException('Download token has expired. Request a new one from the order owner.');
        }
        return { orderId: payload.orderId, expiresAt: new Date(payload.exp * 1000) };
    }

    /**
     * Build a public download URL for the given token.
     *
     * Uses SettingsService.getSiteUrl() so the URL points at the
     * customer's configured public hostname (or the env fallback in
     * env-driven deployments). The customer pastes this URL into a
     * browser and the file streams.
     */
    async buildDownloadUrl(token: string): Promise<string> {
        const base = await this.settings.getSiteUrl();
        // /api prefix is stripped at the proxy layer in production
        // deployments; in local dev the backend listens on :3001
        // directly, so callers should construct the full URL via the
        // base they have. We emit the canonical form here.
        return `${base}/downloads/${encodeURIComponent(token)}`;
    }

    /**
     * Stream the bundle for a verified token. Caller has already
     * verified the token; we trust orderId here and skip re-checking
     * the DB for performance — the token's signature is the auth.
     */
    async streamBundle(orderId: string, res: Response): Promise<void> {
        // Honour an explicit pre-built bundle path if the operator has
        // set one. Pre-built bundles are the recommended production
        // path — generated once at release time, signed/verified, and
        // served as static bytes.
        const bundlePath = (process.env.MERO_RELEASE_BUNDLE_PATH || '').trim();
        if (bundlePath) {
            if (!fs.existsSync(bundlePath)) {
                throw new NotFoundException(
                    `MERO_RELEASE_BUNDLE_PATH is set to ${bundlePath} but no file exists there. Tell your hosting admin.`,
                );
            }
            const filename = path.basename(bundlePath) || 'mero-cms.zip';
            this.streamFile(bundlePath, filename, res);
            this.logger.log(`Streamed pre-built bundle ${filename} for order ${orderId}`);
            return;
        }

        // Otherwise build on the fly. The backend's process.cwd() is
        // /app/backend in Docker (per the Dockerfile WORKDIR) or the
        // backend/ directory in dev. The repo root is one level up.
        // We zip from there.
        const repoRoot = path.resolve(process.cwd(), '..');
        if (!fs.existsSync(path.join(repoRoot, 'package.json'))) {
            throw new BadRequestException(
                'Could not locate the Mero CMS source tree to bundle. Set MERO_RELEASE_BUNDLE_PATH to a pre-built zip.',
            );
        }

        const zip = new AdmZip();
        this.addTreeToZip(zip, repoRoot, '', this.bundleExclusions(repoRoot));

        const buffer = zip.toBuffer();
        const filename = `mero-cms-${this.shortVersion()}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
        this.logger.log(`Streamed on-the-fly bundle (${buffer.length} bytes) for order ${orderId}`);
    }

    // ── Internals ────────────────────────────────────────────────

    private signPayload(payload: DownloadTokenPayload): string {
        const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const sig = this.hmac(b64);
        return `${b64}.${sig}`;
    }

    private hmac(input: string): string {
        const secret = process.env.JWT_SECRET || '';
        if (!secret) {
            // Safety: refuse to mint or verify tokens without a secret.
            // bootstrapSecrets() guarantees this is set in any real run.
            throw new Error('JWT_SECRET not configured — cannot sign download tokens.');
        }
        return crypto.createHmac('sha256', secret).update(input).digest('base64url');
    }

    /**
     * Patterns to exclude from the bundle. Anything matching is
     * skipped during the recursive zip walk. Patterns are checked
     * against POSIX-style paths relative to the repo root.
     */
    private bundleExclusions(repoRoot: string): (relPath: string) => boolean {
        const skipDirs = new Set([
            'node_modules',
            '.git',
            '.next',
            '.turbo',
            'dist',
            'build',
            'out',
            '.cache',
            '.idea',
            '.vscode',
            '.claude',
            'coverage',
            'temp_theme',
            'temp_website_repo',
            'tmp',
            'release-bundles',
            'data', // backend MERO_DATA_DIR mount
        ]);
        const skipFiles = new Set([
            '.env',
            '.env.local',
            '.env.development',
            '.env.production',
            '.env.test',
            'secrets.json',
            'setup.json',
            'site-data.json',
            '.DS_Store',
            'Thumbs.db',
            'npm-debug.log',
            'yarn-debug.log',
            'yarn-error.log',
        ]);

        return (relPath: string) => {
            const parts = relPath.split('/').filter(Boolean);
            // Any directory in the path matches a skip-dir → exclude
            // the whole subtree.
            for (const part of parts) {
                if (skipDirs.has(part)) return true;
            }
            const basename = parts[parts.length - 1];
            if (skipFiles.has(basename)) return true;
            // Skip uploads — these are user content, not source.
            if (relPath.startsWith('backend/uploads/') || relPath === 'backend/uploads') return true;
            // Skip log files and theme zip exports.
            if (basename?.endsWith('.log')) return true;
            if (relPath.match(/^themes\/[^/]+\.zip$/)) return true;
            return false;
        };
    }

    private addTreeToZip(zip: AdmZip, absRoot: string, relPath: string, exclude: (p: string) => boolean): void {
        if (relPath && exclude(relPath)) return;
        const absPath = path.join(absRoot, relPath);
        let stat: fs.Stats;
        try {
            stat = fs.statSync(absPath);
        } catch {
            return;
        }
        if (stat.isDirectory()) {
            for (const entry of fs.readdirSync(absPath)) {
                const childRel = relPath ? `${relPath}/${entry}` : entry;
                this.addTreeToZip(zip, absRoot, childRel, exclude);
            }
        } else if (stat.isFile()) {
            try {
                const data = fs.readFileSync(absPath);
                zip.addFile(relPath, data);
            } catch (err: any) {
                this.logger.warn(`Skipped ${relPath}: ${err?.message}`);
            }
        }
    }

    private shortVersion(): string {
        // Try package.json version first; fall back to a date stamp.
        try {
            const pkgPath = path.resolve(process.cwd(), '..', 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                if (pkg.version) return String(pkg.version);
            }
        } catch {
            /* fall through */
        }
        return new Date().toISOString().slice(0, 10);
    }

    private streamFile(absPath: string, filename: string, res: Response): void {
        const stat = fs.statSync(absPath);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stat.size);
        const stream = fs.createReadStream(absPath);
        stream.pipe(res);
    }
}
