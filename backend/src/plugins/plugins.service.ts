import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { ThemesService } from '../themes/themes.service';
import { SaasLicenseService } from '../packages/license.service';
import { PluginManifest, PLUGIN_CATALOG, getManifest, MIN_TIER_MAP } from './catalog';
import { SetupProgressService } from '../setup/setup-progress.service';

/**
 * Stored shape of an installed plugin. Lives inside the generic `setting` KV
 * under key `installed_plugins`; the whole collection is serialised as JSON.
 * This avoids a dedicated migration while we iterate on the plugin surface.
 */
export interface InstalledPlugin {
    slug: string;
    name: string;
    version: string;
    enabled: boolean;
    installedAt: string;
    licenseKey?: string;
    purchasedPriceNPR: number;
    config?: Record<string, unknown>;
}

const SETTING_KEY = 'installed_plugins';

/**
 * Why each plugin install can fail. Returned by checkInstallGates() and
 * surfaced in the marketplace listing so the admin UI can render a
 * specific "why is this disabled" tooltip and the right remediation
 * link (billing for tier upgrade vs. theme picker for compatibility).
 */
export type GateStatus = 'ok' | 'tier' | 'theme' | 'both';

export interface InstallGateResult {
    status: GateStatus;
    installable: boolean;
    requiredTier?: number;       // numeric tier the plugin needs
    requiredTierLabel?: string;  // 'Premium', 'Professional', etc.
    currentTier: number;
    requiredThemeFields?: string[];
    compatibleThemes?: string[];
    currentThemeSlug: string | null;
    message?: string;            // human-readable explanation
}

@Injectable()
export class PluginsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentsService: PaymentsService,
        private readonly themesService: ThemesService,
        private readonly licenseService: SaasLicenseService,
        // Shared progress bus from SetupModule (@Global). Plugin
        // reinstall is a fast operation today, but we emit progress
        // events anyway so future heavy work — remote registry fetch,
        // signature verification, asset download — can stream without
        // re-plumbing the controller.
        private readonly progress: SetupProgressService,
    ) {}

    /**
     * Compute install gates for one plugin against the current
     * subscription + active theme. Pure read; doesn't mutate anything.
     * Used both at install-time (to refuse bad installs) and in the
     * marketplace listing (to annotate cards with their state).
     */
    async checkInstallGates(manifest: PluginManifest): Promise<InstallGateResult> {
        // Tier gate.
        const licenseInfo = await this.licenseService.getLicenseInfo();
        const currentTier = (licenseInfo as any)?.tier ?? 1;
        // Prefer the actual package name (e.g. "Enterprise") over a
        // numeric-tier-indexed lookup, which conflates org-enterprise
        // and personal-professional (both tier 3) and would tell an
        // Enterprise customer they're on "Professional".
        const currentTierName: string =
            (licenseInfo as any)?.tierName ||
            (licenseInfo as any)?.package?.name ||
            this.tierLabel(currentTier);
        const requiredTier = manifest.minTier ? MIN_TIER_MAP[manifest.minTier] : 1;
        const requiredTierLabel = manifest.minTier
            ? manifest.minTier.charAt(0).toUpperCase() + manifest.minTier.slice(1)
            : undefined;
        const tierOk = currentTier >= requiredTier;

        // Theme gate.
        const activeThemeSlug = await this.themesService.getActiveTheme();
        const themeConfig = await this.themesService.getActiveThemeConfig();
        let themeOk = true;

        if (manifest.compatibleThemes && manifest.compatibleThemes.length > 0) {
            const allowsAny = manifest.compatibleThemes.includes('*');
            if (!allowsAny && (!activeThemeSlug || !manifest.compatibleThemes.includes(activeThemeSlug))) {
                themeOk = false;
            }
        }

        if (manifest.requiredThemeFields && manifest.requiredThemeFields.length > 0 && themeConfig) {
            // Check the field at the top level. Modern themes also nest
            // some fields (notably `sectionVariants`) under each entry of
            // `designs[]` so a single theme.json can ship multiple visual
            // variants. We accept either shape — top-level OR present
            // and non-empty on at least one design entry — so plugins
            // like the Visual / Website UI Editor that depend on
            // sectionVariants don't get blocked on themes that simply
            // moved the field one level down.
            const designs: any[] = Array.isArray((themeConfig as any).designs)
                ? (themeConfig as any).designs
                : [];

            // Match the original "field is present" semantics — only
            // undefined/null and empty arrays are treated as "missing".
            // An empty object (`sectionVariants: {}`) still counts as
            // "the theme has opted into this contract".
            const isPresent = (v: any): boolean => {
                if (v === undefined || v === null) return false;
                if (Array.isArray(v) && v.length === 0) return false;
                return true;
            };

            for (const field of manifest.requiredThemeFields) {
                const top = (themeConfig as any)[field];
                if (isPresent(top)) continue;
                const inAnyDesign = designs.some((d) => isPresent(d?.[field]));
                if (!inAnyDesign) {
                    themeOk = false;
                    break;
                }
            }
        } else if (manifest.requiredThemeFields && manifest.requiredThemeFields.length > 0 && !themeConfig) {
            // No active theme, but plugin needs theme fields — block.
            themeOk = false;
        }

        // Compose status.
        let status: GateStatus = 'ok';
        if (!tierOk && !themeOk) status = 'both';
        else if (!tierOk) status = 'tier';
        else if (!themeOk) status = 'theme';

        let message: string | undefined;
        if (status === 'tier') {
            message = `Requires ${requiredTierLabel} or higher. You're on ${currentTierName}.`;
        } else if (status === 'theme') {
            if (manifest.compatibleThemes) {
                message = `Switch to a compatible theme: ${manifest.compatibleThemes.join(', ')}.`;
            } else if (manifest.requiredThemeFields) {
                message = `The active theme doesn't expose ${manifest.requiredThemeFields.join(', ')} in its theme.json.`;
            }
        } else if (status === 'both') {
            message = `Needs both a tier upgrade (to ${requiredTierLabel}) and a compatible theme.`;
        }

        return {
            status,
            installable: status === 'ok',
            requiredTier: manifest.minTier ? requiredTier : undefined,
            requiredTierLabel,
            currentTier,
            requiredThemeFields: manifest.requiredThemeFields,
            compatibleThemes: manifest.compatibleThemes,
            currentThemeSlug: activeThemeSlug || null,
            message,
        };
    }

    private tierLabel(tier: number): string {
        return ['Free', 'Basic', 'Premium', 'Professional', 'Custom'][tier] ?? 'Free';
    }

    // ─── Storage primitives ─────────────────────────────────────────────────

    private async readInstalled(): Promise<InstalledPlugin[]> {
        const row = await (this.prisma as any).setting.findUnique({
            where: { key: SETTING_KEY },
        });
        if (!row?.value) return [];
        try {
            const parsed = JSON.parse(row.value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private async writeInstalled(list: InstalledPlugin[]): Promise<void> {
        await (this.prisma as any).setting.upsert({
            where: { key: SETTING_KEY },
            create: { key: SETTING_KEY, value: JSON.stringify(list) },
            update: { value: JSON.stringify(list) },
        });
    }

    // ─── Public API ─────────────────────────────────────────────────────────

    async listInstalled(): Promise<InstalledPlugin[]> {
        return this.readInstalled();
    }

    /** Marketplace catalog enriched with `installed` + `enabled` flags
        and per-plugin install gate status. The frontend renders the gate
        result as a tooltip + remediation link on each card. */
    async listMarketplace(): Promise<Array<PluginManifest & {
        installed: boolean;
        enabled: boolean;
        gate: InstallGateResult;
    }>> {
        const installed = await this.readInstalled();
        const bySlug = new Map(installed.map((p) => [p.slug, p]));
        // Compute gates in parallel — each does one DB read + theme.json
        // parse, so this stays fast even with a larger catalog.
        const withGates = await Promise.all(
            PLUGIN_CATALOG.map(async (m) => {
                const gate = await this.checkInstallGates(m);
                return {
                    ...m,
                    installed: bySlug.has(m.slug),
                    enabled: bySlug.get(m.slug)?.enabled ?? false,
                    gate,
                };
            }),
        );
        return withGates;
    }

    /**
     * Install a plugin. Free plugins install immediately; paid plugins require
     * a licenseKey from the purchase-verify flow.
     *
     * @param skipGateCheck Internal flag — set when called from
     *   verifyPurchase after a paid order, where the gate was already
     *   checked at initiate time. Without this flag a customer who
     *   downgraded between purchase and install would be locked out
     *   of something they paid for.
     */
    async install(slug: string, licenseKey?: string, skipGateCheck = false): Promise<InstalledPlugin> {
        const manifest = getManifest(slug);
        if (!manifest) throw new NotFoundException(`Plugin "${slug}" is not in the marketplace catalog.`);

        const existing = await this.readInstalled();
        if (existing.some((p) => p.slug === slug)) {
            throw new ConflictException(`Plugin "${slug}" is already installed.`);
        }

        // Dual-gate compatibility check. Refuse to install if the user's
        // tier is below the plugin's minTier OR the active theme doesn't
        // expose the fields the plugin depends on. Returns a structured
        // 403 with `gate` info so the frontend can render a precise
        // remediation message ("upgrade to Premium" vs "switch theme").
        if (!skipGateCheck) {
            const gate = await this.checkInstallGates(manifest);
            if (!gate.installable) {
                throw new ForbiddenException({
                    message: gate.message || `Plugin "${manifest.name}" is not compatible with your current setup.`,
                    gate,
                });
            }
        }

        if (manifest.priceNPR > 0 && !licenseKey) {
            throw new BadRequestException(
                `Plugin "${manifest.name}" is a paid plugin (NPR ${manifest.priceNPR.toLocaleString()}). Complete the purchase flow first.`,
            );
        }

        const entry: InstalledPlugin = {
            slug: manifest.slug,
            name: manifest.name,
            version: manifest.version,
            enabled: true,
            installedAt: new Date().toISOString(),
            licenseKey,
            purchasedPriceNPR: manifest.priceNPR,
        };

        await this.writeInstalled([...existing, entry]);
        return entry;
    }

    async toggle(slug: string, enabled: boolean): Promise<InstalledPlugin> {
        const list = await this.readInstalled();
        const idx = list.findIndex((p) => p.slug === slug);
        if (idx === -1) throw new NotFoundException(`Plugin "${slug}" is not installed.`);
        list[idx] = { ...list[idx], enabled };
        await this.writeInstalled(list);
        return list[idx];
    }

    async uninstall(slug: string): Promise<{ slug: string; uninstalled: true }> {
        const list = await this.readInstalled();
        const next = list.filter((p) => p.slug !== slug);
        if (next.length === list.length) {
            throw new NotFoundException(`Plugin "${slug}" is not installed.`);
        }
        await this.writeInstalled(next);
        return { slug, uninstalled: true };
    }

    /**
     * Reinstall an already-installed plugin.
     *
     * What this means today:
     *   1. Re-look-up the manifest from the catalog (so name/version
     *      pick up any catalog updates shipped since first install).
     *   2. Re-run install gates — refuses if the customer downgraded
     *      below the plugin's minTier or switched to a theme that
     *      doesn't expose the plugin's required fields.
     *   3. Rewrite the install record, preserving the customer's
     *      `licenseKey`, `purchasedPriceNPR`, and `config` (so paid
     *      plugins don't need re-purchasing on a reinstall) and
     *      bumping `version` and `installedAt`.
     *
     * What this is NOT:
     *   - It doesn't re-run any plugin code; today plugins ship as
     *     manifest entries that the runtime reads, not as installable
     *     hooks. When we add remote-fetched plugin bundles in the
     *     future, this method is the place that adds the
     *     "re-download + re-verify" step.
     *
     * Use cases:
     *   - Catalog updated with a new gate / new dependent fields and
     *     the install record is stale.
     *   - The install record got partially corrupted (extremely rare —
     *     it lives in the settings KV — but we want a recovery path).
     *   - Future: theme switched and the plugin's `config` keys map
     *     to fields on the new theme; reinstall re-applies defaults.
     */
    async reinstall(slug: string): Promise<InstalledPlugin> {
        this.progress.started(`plugin-${slug}`, `Reinstalling plugin "${slug}"…`);
        try {
            const manifest = getManifest(slug);
            if (!manifest) {
                this.progress.failed(`plugin-${slug}`, `Plugin "${slug}" is not in the catalog.`);
                throw new NotFoundException(`Plugin "${slug}" is not in the marketplace catalog.`);
            }

            const list = await this.readInstalled();
            const idx = list.findIndex((p) => p.slug === slug);
            if (idx === -1) {
                this.progress.failed(`plugin-${slug}`, `Plugin "${slug}" is not installed — install it first.`);
                throw new NotFoundException(`Plugin "${slug}" is not installed.`);
            }
            const existing = list[idx];

            this.progress.progress(`plugin-${slug}`, 'Re-checking compatibility gates…');
            const gate = await this.checkInstallGates(manifest);
            if (!gate.installable) {
                this.progress.failed(
                    `plugin-${slug}`,
                    `Reinstall blocked by ${gate.status} gate: ${gate.message || 'incompatible setup'}.`,
                );
                throw new ForbiddenException({
                    message: gate.message || `Plugin "${manifest.name}" is not compatible with your current setup.`,
                    gate,
                });
            }

            // Refreshed record. We deliberately keep installedAt as
            // the ORIGINAL install timestamp so audit logs / reporting
            // don't lose the "first installed" date. `lastReinstalledAt`
            // tracks the new bump separately.
            const refreshed: InstalledPlugin = {
                ...existing,
                name: manifest.name,
                version: manifest.version,
                // enabled state is preserved — reinstall isn't enable.
            };
            (refreshed as any).lastReinstalledAt = new Date().toISOString();

            list[idx] = refreshed;
            await this.writeInstalled(list);

            this.progress.completed(`plugin-${slug}`, `Plugin "${manifest.name}" reinstalled (v${manifest.version}).`);
            return refreshed;
        } catch (err: any) {
            // Re-throw after emitting; we already emitted a failed event
            // for the recoverable cases above. Anything that hits here
            // is unexpected.
            if (!(err instanceof NotFoundException) && !(err instanceof ForbiddenException)) {
                this.progress.failed(`plugin-${slug}`, `Unexpected error: ${err?.message}`, err?.stack);
            }
            throw err;
        }
    }

    /**
     * Kick off a purchase. Reuses the existing Khalti integration from the
     * PaymentsService — identical pattern to package purchases, just with
     * `plugin:<slug>` as the purchase order id.
     */
    async initiatePurchase(slug: string, customerEmail: string, provider: 'khalti' | 'stripe' | 'esewa' = 'khalti') {
        const manifest = getManifest(slug);
        if (!manifest) throw new NotFoundException(`Plugin "${slug}" is not in the marketplace catalog.`);
        if (manifest.priceNPR <= 0) {
            throw new BadRequestException(`Plugin "${slug}" is free — use the install endpoint instead.`);
        }
        if (!customerEmail) {
            throw new BadRequestException('customerEmail is required to initiate a plugin purchase.');
        }

        // Gate-check the plugin first — no point starting a purchase
        // for something the customer's setup can't actually run.
        const gate = await this.checkInstallGates(manifest);
        if (!gate.installable) {
            throw new BadRequestException({
                message: gate.message || `Plugin "${manifest.name}" is not compatible with your current setup.`,
                gate,
            });
        }

        // Use the same Order pipeline as CMS license purchases.
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        return this.paymentsService.createOrder({
            customerEmail,
            itemType: 'plugin',
            pluginSlug: slug,
            amountNPR: manifest.priceNPR,
            provider,
            successUrl: `${baseUrl}/dashboard/plugins?purchased=${slug}&order={ORDER_ID}`,
            cancelUrl: `${baseUrl}/dashboard/plugins?cancelled=${slug}`,
        });
    }

    /**
     * Verify a plugin purchase by orderId. Reads the Order; if it's
     * marked paid (the webhook already ran), installs the plugin and
     * stores the licenseKey from the order on the install record.
     *
     * Idempotent — re-verifying an already-installed plugin returns the
     * existing install record.
     */
    async verifyPurchase(orderId: string, slug: string): Promise<InstalledPlugin> {
        const manifest = getManifest(slug);
        if (!manifest) throw new NotFoundException(`Plugin "${slug}" is not in the marketplace catalog.`);

        const order = await (this.prisma as any).order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order ${orderId} not found.`);
        if (order.pluginSlug !== slug) {
            throw new BadRequestException(`Order ${orderId} is not for plugin "${slug}".`);
        }
        if (order.status !== 'paid') {
            throw new BadRequestException(`Order ${orderId} is in status "${order.status}", not paid.`);
        }

        // Already installed (e.g. user refreshed the success page) →
        // return the existing record rather than throwing.
        const existing = await this.readInstalled();
        const found = existing.find(p => p.slug === slug);
        if (found) return found;

        return this.install(slug, order.licenseKey || undefined, /* skipGateCheck */ true);
    }

    // ─── Helpers for other modules that want to check plugin state ──────────

    /**
     * Return true if a plugin is installed AND enabled. Other modules can
     * use this to gate their own behaviour on plugin presence.
     */
    async isActive(slug: string): Promise<boolean> {
        const list = await this.readInstalled();
        return list.some((p) => p.slug === slug && p.enabled);
    }
}
