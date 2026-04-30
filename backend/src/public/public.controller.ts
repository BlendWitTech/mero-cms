import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, NotFoundException, Req } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SetupService } from '../setup/setup.service';
import { ThemesService } from '../themes/themes.service';
import { PackagesService } from '../packages/packages.service';

@Controller('public')
export class PublicController {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
        private setupService: SetupService,
        private themesService: ThemesService,
        private packagesService: PackagesService,
    ) { }

    @Get('pages/:slug')
    async getPage(@Param('slug') slug: string) {
        const activeThemeSetting = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });
        const theme = activeThemeSetting?.value || null;

        // Try to find page for active theme first
        let page = await (this.prisma as any).page.findFirst({
            where: { slug, status: 'PUBLISHED', theme },
        });

        // Fallback: If no theme is active or page not found, try any published page with that slug
        if (!page) {
            page = await (this.prisma as any).page.findFirst({
                where: { slug, status: 'PUBLISHED' },
            });
        }

        if (!page) {
            throw new NotFoundException(`Page '${slug}' not found`);
        }

        return page;
    }

    @SkipThrottle()
    @Get('site-data')
    async getSiteData() {
        const [settingsMap, enabledModules, pageSchema, moduleAliases] = await Promise.all([
            this.settingsService.findAll(),
            this.setupService.getEnabledModules(),
            this.themesService.getPageSchema(),
            this.themesService.getModuleAliases(),
        ]);

        // Build social links from individual keys or a JSON blob
        let socialLinks: Record<string, string> | null = null;
        const rawSocial = settingsMap['social_links'];
        if (rawSocial) {
            try { socialLinks = JSON.parse(rawSocial); } catch { }
        }
        // Also support individual keys like social_facebook, social_instagram, etc.
        const socialKeys = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp'];
        for (const key of socialKeys) {
            const val = settingsMap[`social_${key}`];
            if (val) {
                socialLinks = socialLinks || {};
                socialLinks[key] = val;
            }
        }

        const data: Record<string, any> = {
            pageSchema,
            moduleAliases,
            settings: {
                siteTitle: settingsMap['site_title'] || '',
                tagline: settingsMap['site_tagline'] || settingsMap['tagline'] || '',
                copyrightText: settingsMap['copyright_text'] || '',
                logoUrl: settingsMap['logo_url'] || null,
                faviconUrl: settingsMap['favicon_url'] || null,
                // Public site URL — used by sitemap.xml, robots.txt, OG
                // canonical URLs. Configurable in admin so customers don't
                // edit env files. Theme falls through to NEXT_PUBLIC_SITE_URL
                // and finally localhost when this is unset.
                siteUrl: settingsMap['site_url'] || null,
                // Media host for next/image. Auto-derived from site_url at
                // request time when unset; both are kept separate so split-
                // domain CDN setups can override media independently.
                mediaHost: settingsMap['media_host'] || null,
                primaryColor: settingsMap['primary_color'] || null,
                // Admin login-page branding — safe to expose publicly because
                // it's literally rendered on the unauthenticated login / register
                // pages. Frontend uses these to theme the pre-auth UI.
                cmsTitle: settingsMap['cms_title'] || settingsMap['site_title'] || 'Mero CMS',
                cmsSubtitle: settingsMap['cms_subtitle'] || null,
                cmsLogo: settingsMap['cms_logo'] || settingsMap['logo_url'] || null,
                footerText: settingsMap['footer_text'] || null,
                contactEmail: settingsMap['contact_email'] || null,
                contactPhone: settingsMap['contact_phone'] || null,
                address: settingsMap['address'] || null,
                socialLinks,
                activeTheme: settingsMap['active_theme'] || null,
                // Read by scripts/dev-theme.js to detect re-activation of
                // the same theme — bumped on every setActiveTheme call.
                themeRestartCounter: Number(settingsMap['theme_restart_counter']) || 0,
                // Customisable page section content
                heroTitle: settingsMap['hero_title'] || null,
                heroSubtitle: settingsMap['hero_subtitle'] || null,
                heroBgImage: settingsMap['hero_bg_image'] || null,
                heroBgVideo: settingsMap['hero_bg_video'] || null,
                aboutTitle: settingsMap['about_title'] || null,
                aboutContent: settingsMap['about_content'] || null,
                aboutImage: settingsMap['about_image'] || null,
                ctaText: settingsMap['cta_text'] || null,
                ctaUrl: settingsMap['cta_url'] || null,
                // SEO defaults
                metaDescription: settingsMap['meta_description'] || null,
                googleAnalyticsId: settingsMap['google_analytics_id'] || null,
                // Design system — canonical branding contract (16 keys).
                // These flow into the theme's CSS custom properties at runtime
                // via app/layout.tsx, so changes in admin take effect without
                // a code redeploy. Themes declare which of these they respect
                // in theme.json's `brandingFields` block.
                headingFont: settingsMap['heading_font'] || null,
                bodyFont: settingsMap['body_font'] || null,
                secondaryColor: settingsMap['secondary_color'] || null,
                accentColor: settingsMap['accent_color'] || null,
                // Interface color palette
                textColor: settingsMap['text_color'] || null,
                headingColor: settingsMap['heading_color'] || null,
                linkColor: settingsMap['link_color'] || null,
                mutedTextColor: settingsMap['muted_text_color'] || null,
                // Typography scale + weight
                baseFontSize: settingsMap['base_font_size'] || null,
                headingWeight: settingsMap['heading_weight'] || null,
                bodyWeight: settingsMap['body_weight'] || null,
                // Layout tokens
                borderRadius: settingsMap['border_radius'] || settingsMap['btn_border_radius'] || null,
                layoutDensity: settingsMap['layout_density'] || settingsMap['global_padding'] || null,
                listingMode: settingsMap['listing_mode'] || 'load-more',
            },
            limits: {
                hasWhiteLabel: false, // Default
                hasApiAccess: false,
                storageLimitGB: 1,
                teamLimit: 1,
            },
            enabledModules,
        };

        const packageId = settingsMap['active_package_id'] || 'personal-basic';
        const pkg = await (this.prisma as any).package.findUnique({ where: { id: packageId } });
        if (pkg) {
            data.limits = {
                hasWhiteLabel: pkg.hasWhiteLabel,
                hasApiAccess: pkg.hasApiAccess,
                storageLimitGB: pkg.storageLimitGB,
                teamLimit: pkg.teamLimit,
            };
        }

        const activeTheme = settingsMap['active_theme'] || null;
        const fetches: Promise<void>[] = [];

        // Module-enabled checks alone aren't enough — the Prisma client
        // must also have the model. After a module is toggled, the schema
        // is rebuilt and Prisma regenerated; until that completes (or if
        // the customer toggled module flags faster than the rebuild),
        // `this.prisma.menu` can be undefined even though enabledModules
        // says menus is on. Belt-and-braces check both.
        if (enabledModules.includes('menus')) {
            const menuModel = (this.prisma as any).menu;
            if (menuModel) {
                fetches.push(
                    menuModel.findMany({
                        where: activeTheme ? { theme: activeTheme } : undefined,
                        include: {
                            items: {
                                orderBy: { order: 'asc' },
                                include: {
                                    children: { orderBy: { order: 'asc' } },
                                },
                                where: { parentId: null },
                            },
                        },
                    }).then((menus: any[]) => { data.menus = menus; }),
                );
            } else {
                data.menus = [];
            }
        }

        if (enabledModules.includes('pages')) {
            const pageModel = (this.prisma as any).page;
            if (pageModel) {
                fetches.push(
                    pageModel.findMany({
                        where: { status: 'PUBLISHED', ...(activeTheme ? { theme: activeTheme } : {}) },
                        select: { id: true, title: true, slug: true, description: true, content: true, data: true },
                    }).then((pages: any[]) => { data.pages = pages; }),
                );
            } else {
                data.pages = [];
            }
        }



        if (enabledModules.includes('team')) {
            const teamModel = (this.prisma as any).teamMember;
            if (teamModel) {
                fetches.push(
                    teamModel.findMany({
                        where: { isActive: true },
                        orderBy: { order: 'asc' },
                    }).then((team: any[]) => { data.team = team; }),
                );
            } else {
                data.team = [];
            }
        }

        if (enabledModules.includes('testimonials')) {
            const testimonialModel = (this.prisma as any).testimonial;
            if (testimonialModel) {
                fetches.push(
                    testimonialModel.findMany({
                        where: { isActive: true },
                        take: 20,
                        orderBy: { order: 'asc' },
                    }).then((testimonials: any[]) => {
                        // Normalise clientName/clientRole → name/role for theme compatibility
                        data.testimonials = testimonials.map((t: any) => ({
                            ...t,
                            name: t.clientName,
                            role: t.clientRole || null,
                            avatarUrl: t.clientAvatar || null,
                        }));
                    }),
                );
            } else {
                data.testimonials = [];
            }
        }

        if (enabledModules.includes('services')) {
            const serviceModel = (this.prisma as any).service;
            if (serviceModel) {
                fetches.push(
                    serviceModel.findMany({
                        where: { isActive: true },
                        orderBy: { order: 'asc' },
                    }).then((services: any[]) => { data.services = services; }),
                );
            } else {
                data.services = [];
            }
        }

        if (enabledModules.includes('blogs')) {
            fetches.push(
                (this.prisma as any).post.findMany({
                    where: { status: 'PUBLISHED' },
                    orderBy: { publishedAt: 'desc' },
                    take: 6,
                    include: {
                        author: { select: { name: true } },
                        categories: { select: { name: true, slug: true } },
                    },
                }).then((posts: any[]) => {
                    data.recentPosts = posts.map((p: any) => ({
                        ...p,
                        featuredImageUrl: p.coverImage || null,
                    }));
                }),
            );
        }

        // Collections is always-on (core module) — always include
        fetches.push(
            (this.prisma as any).collection.findMany({
                include: {
                    items: {
                        where: { isPublished: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'asc' },
            }).then((collections: any[]) => { data.collections = collections; }),
        );

        await Promise.all(fetches);

        // Expose demo reset time when running in demo mode
        if (process.env.DEMO_MODE === 'true') {
            const resetSetting = await (this.prisma as any).setting.findUnique({ where: { key: 'demo_next_reset' } });
            data.demoNextReset = resetSetting?.value || null;
        }

        return data;
    }

    // ── Public blog posts ─────────────────────────────────────────────────────

    @Get('posts')
    async getPosts(@Query('page') page = '1', @Query('limit') limit = '10', @Query('status') status = 'PUBLISHED') {
        const skip = (Number(page) - 1) * Number(limit);
        const where: any = { status: status.toUpperCase() };
        const [posts, total] = await Promise.all([
            (this.prisma as any).post.findMany({
                where,
                orderBy: { publishedAt: 'desc' },
                skip,
                take: Number(limit),
                include: {
                    author: { select: { name: true } },
                    categories: { select: { name: true, slug: true } },
                },
            }),
            (this.prisma as any).post.count({ where }),
        ]);
        return {
            data: posts.map((p: any) => ({ ...p, featuredImageUrl: p.coverImage || null })),
            total,
            page: Number(page),
            limit: Number(limit),
        };
    }

    @Get('posts/:slug')
    async getPost(@Param('slug') slug: string) {
        const post = await (this.prisma as any).post.findFirst({
            where: { slug, status: 'PUBLISHED' },
            include: {
                author: { select: { name: true } },
                categories: { select: { name: true, slug: true } },
            },
        });
        if (!post) return null;
        return { ...post, featuredImageUrl: post.coverImage || null };
    }


    // ── Public collections ────────────────────────────────────────────────────

    @Get('collections/:slug')
    async getCollection(@Param('slug') slug: string) {
        const collection = await (this.prisma as any).collection.findUnique({
            where: { slug },
            include: {
                // Return basic info without all items if preferred, 
                // but for small collections keeping it is fine.
                // We'll add a separate /items endpoint for paging.
                items: {
                    where: { isPublished: true },
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                },
            },
        });
        if (!collection) throw new NotFoundException(`Collection '${slug}' not found`);
        return collection;
    }

    @Get('collections/:slug/items')
    async getCollectionItems(
        @Param('slug') slug: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('search') search = '',
    ) {
        const collection = await (this.prisma as any).collection.findUnique({ where: { slug } });
        if (!collection) throw new NotFoundException(`Collection '${slug}' not found`);

        const p = Number(page);
        const l = Number(limit);
        const skip = (p - 1) * l;

        const where: any = {
            collectionId: collection.id,
            isPublished: true,
            OR: search ? [
                { title: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { data: { path: ['content'], string_contains: search } }, // Prisma json search
            ] : undefined,
        };

        const [items, total] = await Promise.all([
            (this.prisma as any).collectionItem.findMany({
                where,
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
            }),
            (this.prisma as any).collectionItem.count({ where }),
        ]);

        return {
            data: items,
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        };
    }

    @Get('collections/:slug/items/:itemSlug')
    async getCollectionItem(
        @Param('slug') slug: string,
        @Param('itemSlug') itemSlug: string,
    ) {
        const collection = await (this.prisma as any).collection.findUnique({ where: { slug } });
        if (!collection) throw new NotFoundException(`Collection '${slug}' not found`);

        const item = await (this.prisma as any).collectionItem.findFirst({
            where: { collectionId: collection.id, slug: itemSlug, isPublished: true },
        });
        if (!item) throw new NotFoundException(`Item '${itemSlug}' not found in collection '${slug}'`);
        return item;
    }

    // ── Lead capture ──────────────────────────────────────────────────────────

    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @Post('leads')
    @HttpCode(HttpStatus.CREATED)
    async submitLead(@Body() body: {
        name: string;
        email: string;
        phone?: string;
        message: string;
        source?: string;
    }) {
        if (!body.name || !body.email || !body.message) {
            return { success: false, message: 'Name, email, and message are required.' };
        }

        const leadModel = (this.prisma as any).lead;
        if (!leadModel) {
            console.warn('[PublicController] Leads requested but Lead model missing from schema. Returning mock success.');
            return { success: true, message: 'Thank you! Your message has been received (Demo Mode).' };
        }

        try {
            const lead = await leadModel.create({
                data: {
                    name: body.name,
                    email: body.email,
                    phone: body.phone || null,
                    message: body.message,
                    originPage: body.source || null,
                    status: 'NEW',
                },
            });
            return { success: true, id: lead.id, message: 'Thank you! Your message has been sent successfully.' };
        } catch (error) {
            console.error('Lead submission error:', error);
            return {
                success: false,
                message: 'We are currently unable to process your request. Please try again later.'
            };
        }
    }

    // ── Public form submission ────────────────────────────────────────────────

    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Post('forms/:id/submit')
    @HttpCode(HttpStatus.CREATED)
    async submitForm(
        @Param('id') id: string,
        @Body() data: Record<string, any>,
        @Req() req: any,
    ) {
        const form = await (this.prisma as any).form.findUnique({ where: { id } });
        if (!form) throw new NotFoundException(`Form not found`);
        try {
            const submission = await (this.prisma as any).formSubmission.create({
                data: {
                    formId: id,
                    data,
                    ip: req.ip || null,
                    userAgent: req.headers?.['user-agent'] || null,
                },
            });
            return { success: true, id: submission.id };
        } catch (error) {
            console.error('Form submission error:', error);
            return { success: false, message: 'Submission failed. Please try again.' };
        }
    }

    @Get('packages')
    getPackages(@Query('type') type?: string) {
        return this.packagesService.findAll(type);
    }

    /**
     * Mero Cloud managed-hosting tiers — read-only for the marketing
     * site so prospective customers can see what each cloud tier
     * costs and includes. Pure config, no DB hit, no auth.
     */
    @Get('cloud-tiers')
    getCloudTiers() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CLOUD_TIERS } = require('../config/packages');
        return CLOUD_TIERS;
    }

    /**
     * Raw packages config straight from `config/packages.ts`. The
     * /packages endpoint reads from the DB (which the seed populates
     * from this same file) and may lag if seeds haven't re-run. The
     * marketing site renders directly from config so price changes
     * surface immediately without a re-seed. Returns the full PACKAGES
     * array including priceFromNPR + maintenanceNPR fields.
     */
    @Get('packages-config')
    getPackagesConfig(@Query('type') type?: 'personal' | 'organizational') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PACKAGES } = require('../config/packages');
        return type ? PACKAGES.filter((p: any) => p.websiteType === type) : PACKAGES;
    }

    /**
     * Public capabilities endpoint — themes call this at render time to
     * decide which sections to show, whether to emit plugin-enhanced
     * behaviours, and whether to surface upsell nudges.
     *
     * Shape:
     *   {
     *     package: { id, name, tier, websiteType, supportLevel },
     *     capabilities: { siteEditor, seoFull, analytics, webhooks, ... },
     *     limits: { storageGB, teamMembers, hasWhiteLabel, hasApiAccess, aiEnabled, themeCount },
     *     supportLevel: 'email' | 'priority' | 'dedicated',
     *     installedPlugins: string[],    // slugs of plugins installed & enabled
     *     themeCompat: {
     *       minPackageTier,             // what the theme declares
     *       isCompatible,               // active plan meets theme's minTier
     *       requiredCapabilities,       // theme's required caps (empty if none)
     *       missingRequired,            // caps the theme requires but active plan lacks
     *       pluginIntegrations          // copied from theme.json for the theme's use
     *     }
     *   }
     *
     * Never requires auth so anonymous visitors get the same tier-aware
     * rendering as logged-in admins — the theme uses this to shape the
     * public-facing site.
     */
    @SkipThrottle()
    @Get('capabilities')
    async getPublicCapabilities() {
        const usage = await this.packagesService.getUsage();
        const pkg = usage?.package ?? null;

        // Read the installed_plugins KV blob and reduce to a list of active slugs.
        let installedPlugins: string[] = [];
        try {
            const row = await (this.prisma as any).setting.findUnique({ where: { key: 'installed_plugins' } });
            if (row?.value) {
                const parsed = JSON.parse(row.value);
                if (Array.isArray(parsed)) {
                    installedPlugins = parsed
                        .filter((p: any) => p?.slug && p?.enabled !== false)
                        .map((p: any) => p.slug as string);
                }
            }
        } catch { /* ignore — absence just means "no plugins installed" */ }

        // Read the active theme's manifest for its compat declarations.
        const activeThemeRow = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme' } });
        const activeThemeName = activeThemeRow?.value as string | undefined;
        let themeCompat: any = {
            minPackageTier: 1,
            isCompatible: true,
            requiredCapabilities: [],
            missingRequired: [],
            pluginIntegrations: {},
            supportedPlugins: {},
        };
        if (activeThemeName) {
            try {
                const details = await this.themesService.getThemeDetails(activeThemeName);
                const minTier = (details as any)?.minPackageTier ?? 1;
                const required = (details as any)?.requiredCapabilities ?? [];
                const caps = usage?.capabilities ?? {};
                const missingRequired = required.filter((k: string) => !(caps as any)[k]);
                themeCompat = {
                    minPackageTier: minTier,
                    isCompatible: (pkg?.tier ?? 0) >= minTier && missingRequired.length === 0,
                    requiredCapabilities: required,
                    missingRequired,
                    pluginIntegrations: (details as any)?.pluginIntegrations ?? {},
                    supportedPlugins: (details as any)?.supportedPlugins ?? {},
                };
            } catch { /* ignore — theme may not declare compat yet */ }
        }

        return {
            package: pkg ? {
                id: pkg.id,
                name: pkg.name,
                tier: pkg.tier,
                websiteType: (pkg as any).websiteType,
                supportLevel: (pkg as any).supportLevel,
            } : null,
            capabilities: usage?.capabilities ?? {},
            limits: usage?.limits ?? {},
            supportLevel: (pkg as any)?.supportLevel ?? 'email',
            installedPlugins,
            themeCompat,
        };
    }

}
