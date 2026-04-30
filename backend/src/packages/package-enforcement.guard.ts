import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PackagesService } from './packages.service';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_LIMIT_KEY, PackageLimit } from './require-limit.decorator';
import { getCapabilities, PackageCapabilities } from '../config/packages';

/**
 * Returns true if a marketplace plugin identified by `slug` is currently
 * installed AND enabled. Read directly from the `installed_plugins` setting
 * KV blob so the guard stays decoupled from PluginsService (avoiding a
 * circular dependency through PaymentsService).
 */
async function isPluginActive(prisma: PrismaService, slug: string): Promise<boolean> {
    try {
        const row = await (prisma as any).setting.findUnique({ where: { key: 'installed_plugins' } });
        if (!row?.value) return false;
        const parsed = JSON.parse(row.value);
        if (!Array.isArray(parsed)) return false;
        return parsed.some((p: any) => p?.slug === slug && p?.enabled);
    } catch {
        return false;
    }
}

@Injectable()
export class PackageEnforcementGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private packagesService: PackagesService,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredLimit = this.reflector.getAllAndOverride<PackageLimit>(REQUIRE_LIMIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredLimit) return true;

        const usageData = await this.packagesService.getUsage();
        if (!usageData) return true; // Fail-safe: no plan found -> allow

        const { usage, limits, package: pkg } = usageData;
        const caps: PackageCapabilities = getCapabilities(pkg?.id);

        switch (requiredLimit) {
            // ─── Usage-based limits ────────────────────────────────────────────
            case PackageLimit.TEAM_SIZE:
                if (limits.teamMembers !== -1 && usage.teamMembers >= limits.teamMembers) {
                    throw new ForbiddenException(
                        `Team seat limit reached (${limits.teamMembers}). Please upgrade your plan.`,
                    );
                }
                break;

            case PackageLimit.STORAGE:
                if (limits.storageGB !== -1 && usage.storageGB >= limits.storageGB) {
                    throw new ForbiddenException(
                        `Storage limit reached (${limits.storageGB} GB). Please upgrade your plan.`,
                    );
                }
                break;

            case PackageLimit.THEME_COUNT: {
                // THEME_COUNT gates "can this plan upload custom themes?"
                // After the Apr 2026 rebalance v2, Professional and
                // Enterprise have themeCount === 5 (not unlimited) and
                // Custom is the only tier with -1. The intent of the
                // gate is still "Basic/Premium can't upload, Pro+ can"
                // — so allow upload for any tier whose themeCount is
                // either unlimited (-1) OR greater than 1. Basic and
                // Premium have themeCount of 1 / 3 by definition but
                // both use a curated starterThemes whitelist; their
                // PROFESSIONAL and ENTERPRISE counterparts have at
                // least 5 and need the upload path.
                const themeCount = caps.themeCount;
                const allowsUpload = themeCount === -1 || themeCount >= 5;
                if (!allowsUpload) {
                    throw new ForbiddenException(
                        `Your plan does not include custom theme uploads. Upgrade to Professional or Enterprise to upload your own themes.`,
                    );
                }
                break;
            }

            // ─── Legacy boolean feature gates (pre-capabilities) ───────────────
            case PackageLimit.WHITE_LABEL:
                if (!limits.hasWhiteLabel) {
                    throw new ForbiddenException(`White-labeling is not included in your current plan.`);
                }
                break;

            case PackageLimit.API_ACCESS:
                if (!limits.hasApiAccess) {
                    throw new ForbiddenException(`Direct API access is not included in your current plan.`);
                }
                break;

            case PackageLimit.AI_STUDIO:
                if (!limits.aiEnabled) {
                    throw new ForbiddenException(
                        `AI Content Studio is not included in your current plan. Please upgrade to Pro or Enterprise.`,
                    );
                }
                break;

            // ─── New capability-based feature gates ────────────────────────────
            case PackageLimit.PLUGIN_MARKETPLACE:
                if (!caps.pluginMarketplace) {
                    throw new ForbiddenException(
                        `Plugin Marketplace is not included in your current plan. Upgrade to Premium or higher.`,
                    );
                }
                break;

            case PackageLimit.THEME_CODE_EDIT:
                if (!caps.themeCodeEdit) {
                    throw new ForbiddenException(
                        `Code-level theme editing is only available on Professional and Enterprise plans.`,
                    );
                }
                break;

            case PackageLimit.VISUAL_THEME_EDITOR:
                // Enterprise (+ Custom) get it by default. Any other tier
                // must have purchased the `visual-editor` marketplace plugin.
                if (!caps.visualThemeEditor) {
                    const hasAddon = await isPluginActive(this.prisma, 'visual-editor');
                    if (!hasAddon) {
                        throw new ForbiddenException(
                            `The Visual / Website UI Editor is Enterprise-only. Upgrade your plan or purchase the Visual Editor add-on from the Plugin Marketplace to unlock it.`,
                        );
                    }
                }
                break;

            case PackageLimit.DASHBOARD_BRANDING:
                if (!caps.dashboardBranding) {
                    throw new ForbiddenException(
                        `CMS dashboard branding is only available on the Organizational Enterprise plan.`,
                    );
                }
                break;

            case PackageLimit.WEBHOOKS:
                if (!caps.webhooks) {
                    throw new ForbiddenException(
                        `Webhooks are not included on Basic plans. Upgrade to Premium or higher.`,
                    );
                }
                break;

            case PackageLimit.COLLECTIONS:
                if (!caps.collections) {
                    throw new ForbiddenException(
                        `Collections (custom content types) are only available on Professional and Enterprise plans.`,
                    );
                }
                break;

            case PackageLimit.FORMS:
                if (!caps.forms) {
                    throw new ForbiddenException(
                        `Forms are not included on Basic plans. Upgrade to Premium or higher.`,
                    );
                }
                break;

            case PackageLimit.ANALYTICS:
                if (!caps.analytics) {
                    throw new ForbiddenException(
                        `In-app analytics is not included on Basic plans. Upgrade to Premium or higher.`,
                    );
                }
                break;

            case PackageLimit.AUDIT_LOG:
                if (!caps.auditLog) {
                    throw new ForbiddenException(
                        `Audit log is not included on Basic plans. Upgrade to Premium or higher.`,
                    );
                }
                break;

            case PackageLimit.SITE_EDITOR:
                if (!caps.siteEditor) {
                    throw new ForbiddenException(
                        `The full Site Editor (site pages) is not included on Basic plans. Upgrade to Premium or higher.`,
                    );
                }
                break;

            case PackageLimit.SEO_FULL:
                if (!caps.seoFull) {
                    throw new ForbiddenException(
                        `The complete SEO suite (redirects, robots.txt editor) is not included on Basic plans. Upgrade to Premium or higher.`,
                    );
                }
                break;
        }

        return true;
    }
}
