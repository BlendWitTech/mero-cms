import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PACKAGES, getCapabilities } from '../config/packages';

function toPrismaPrice(priceNPR: any) {
    if (priceNPR === 'custom') return { isCustomPrice: true, priceMin: null, priceMax: null };
    if (typeof priceNPR === 'object') return { isCustomPrice: false, priceMin: priceNPR.min, priceMax: priceNPR.max };
    return { isCustomPrice: false, priceMin: priceNPR as number, priceMax: null };
}

function toApiPrice(pkg: any): number | { min: number; max: number } | 'custom' {
    if (pkg.isCustomPrice) return 'custom';
    if (pkg.priceMax !== null && pkg.priceMax !== undefined) return { min: pkg.priceMin, max: pkg.priceMax };
    return pkg.priceMin ?? 0;
}

@Injectable()
export class PackagesService implements OnModuleInit {
    constructor(private prisma: PrismaService) {}

    async onModuleInit() {
        // Always upsert so changes to packages.ts are reflected on next restart
        await this.seedDefaults();
    }

    async getActivePackage() {
        // 1. DB setting takes priority (set by activateLicense or setActivePackage)
        const setting = await (this.prisma as any).setting.findUnique({
            where: { key: 'active_package_id' },
        });
        let packageId: string = setting?.value || '';

        // 2. Fall back to LICENSE_KEY env var
        if (!packageId) {
            const envKey = process.env.LICENSE_KEY || '';
            if (envKey.startsWith('eyJ')) {
                try {
                    const parts = envKey.split('.');
                    const decode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
                    const pl = JSON.parse(decode(parts[1]).toString('utf8'));
                    const notExpired = !pl.exp || pl.exp > Math.floor(Date.now() / 1000);
                    if (notExpired) packageId = this.tierToPackageId((pl.tier || '').toLowerCase()) || '';
                } catch {}
            }
        }

        // 3. Fall back to TIER env var
        if (!packageId) {
            const tier = (process.env.TIER || '').toLowerCase();
            packageId = this.tierToPackageId(tier) || '';
        }

        // 4. Hardcoded default
        if (!packageId) packageId = 'personal-basic';

        return (this.prisma as any).package.findUnique({ where: { id: packageId } });
    }

    private tierToPackageId(tier: string): string {
        const map: Record<string, string> = {
            basic: 'org-basic',
            premium: 'org-premium',
            professional: 'personal-professional',
            enterprise: 'org-enterprise',
            custom: 'org-custom',
        };
        return map[tier] || '';
    }

    async seedDefaults() {
        const rows = PACKAGES.map((p, i) => ({
            id: p.id,
            name: p.name,
            websiteType: p.websiteType,
            tier: p.tier,
            aiEnabled: p.aiEnabled,
            ...toPrismaPrice(p.priceNPR),
            tagline: p.tagline,
            features: p.features,
            comingSoon: p.comingSoon ?? [],
            starterThemes: p.starterThemes,
            supportLevel: p.supportLevel,
            highlighted: p.highlighted ?? false,
            storageLimitGB: p.storageLimitGB,
            teamLimit: p.teamLimit,
            hasWhiteLabel: p.hasWhiteLabel,
            hasApiAccess: p.hasApiAccess,
            order: i,
        }));
        for (const row of rows) {
            await (this.prisma as any).package.upsert({
                where: { id: row.id },
                update: row,
                create: row,
            });
        }
    }

    async findAll(websiteType?: string) {
        const rows = await (this.prisma as any).package.findMany({
            where: {
                isActive: true,
                ...(websiteType ? { websiteType } : {}),
            },
            orderBy: [{ websiteType: 'asc' }, { order: 'asc' }],
        });
        return rows.map(this.toApiShape);
    }

    async findAllAdmin() {
        const rows = await (this.prisma as any).package.findMany({
            orderBy: [{ websiteType: 'asc' }, { order: 'asc' }],
        });
        return rows.map(this.toApiShape);
    }

    async update(id: string, body: any) {
        const { priceNPR, ...rest } = body;
        const priceFields = priceNPR !== undefined ? toPrismaPrice(priceNPR) : {};
        return (this.prisma as any).package.update({
            where: { id },
            data: { ...rest, ...priceFields, updatedAt: new Date() },
        });
    }

    async resetToDefaults() {
        await (this.prisma as any).package.deleteMany({});
        await this.seedDefaults();
    }

    async getUsage() {
        const pkg = await this.getActivePackage();
        if (!pkg) return null;

        const [userCount, mediaFiles] = await Promise.all([
            (this.prisma as any).user.count(),
            (this.prisma as any).media.findMany({ select: { size: true } }),
        ]);

        const totalSizeBytes = mediaFiles.reduce((acc: number, m: any) => acc + (m.size || 0), 0);
        const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);

        // Count installed/activated themes on disk (built-in + uploaded).
        const activatedThemes = this.countThemesOnDisk();

        const capabilities = getCapabilities(pkg.id);

        return {
            package: this.toApiShape(pkg),
            usage: {
                storageGB: Number(totalSizeGB.toFixed(3)),
                teamMembers: userCount,
                activatedThemes,
            },
            limits: {
                storageGB: pkg.storageLimitGB,
                teamMembers: pkg.teamLimit,
                hasWhiteLabel: pkg.hasWhiteLabel,
                hasApiAccess: pkg.hasApiAccess,
                aiEnabled: pkg.aiEnabled,
                themeCount: capabilities.themeCount,
            },
            capabilities,
        };
    }

    /**
     * Count theme directories on disk: built-in themes in repo `themes/` plus any
     * uploaded ones in backend/uploads/themes/. Mirrors ThemesService.listThemes()
     * so we don't introduce a circular import.
     */
    private countThemesOnDisk(): number {
        const projectRoot = path.resolve(process.cwd(), '..');
        const builtInPath = path.join(projectRoot, 'themes');
        const uploadPath = path.join(process.cwd(), 'uploads', 'themes');

        const names = new Set<string>();
        try {
            if (fs.existsSync(builtInPath)) {
                fs.readdirSync(builtInPath, { withFileTypes: true })
                    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
                    .forEach((d) => names.add(d.name));
            }
            if (fs.existsSync(uploadPath)) {
                fs.readdirSync(uploadPath, { withFileTypes: true })
                    .filter((d) => d.isDirectory())
                    .forEach((d) => names.add(d.name));
            }
        } catch {
            // best-effort; return what we have
        }
        return names.size;
    }

    private toApiShape = (pkg: any) => {
        const { priceMin, priceMax, isCustomPrice, ...rest } = pkg;
        return {
            ...rest,
            priceNPR: toApiPrice(pkg),
            capabilities: getCapabilities(pkg.id),
        };
    };
}
