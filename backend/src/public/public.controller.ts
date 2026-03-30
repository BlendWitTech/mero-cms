import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, NotFoundException, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SetupService } from '../setup/setup.service';
import { ThemesService } from '../themes/themes.service';

@Controller('public')
export class PublicController {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
        private setupService: SetupService,
        private themesService: ThemesService,
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
                primaryColor: settingsMap['primary_color'] || null,
                footerText: settingsMap['footer_text'] || null,
                contactEmail: settingsMap['contact_email'] || null,
                contactPhone: settingsMap['contact_phone'] || null,
                address: settingsMap['address'] || null,
                socialLinks,
                activeTheme: settingsMap['active_theme'] || null,
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
                // Design system
                headingFont: settingsMap['heading_font'] || null,
                bodyFont: settingsMap['body_font'] || null,
                secondaryColor: settingsMap['secondary_color'] || null,
                accentColor: settingsMap['accent_color'] || null,
                listingMode: settingsMap['listing_mode'] || 'load-more',
            },
            enabledModules,
        };

        const activeTheme = settingsMap['active_theme'] || null;
        const fetches: Promise<void>[] = [];

        if (enabledModules.includes('menus')) {
            fetches.push(
                (this.prisma as any).menu.findMany({
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
        }

        if (enabledModules.includes('pages')) {
            fetches.push(
                (this.prisma as any).page.findMany({
                    where: { status: 'PUBLISHED', ...(activeTheme ? { theme: activeTheme } : {}) },
                    select: { id: true, title: true, slug: true, description: true, content: true, data: true },
                }).then((pages: any[]) => { data.pages = pages; }),
            );
        }



        if (enabledModules.includes('team')) {
            fetches.push(
                (this.prisma as any).teamMember.findMany({
                    where: activeTheme ? { theme: activeTheme } : undefined,
                    orderBy: { order: 'asc' },
                }).then((team: any[]) => { data.team = team; }),
            );
        }

        if (enabledModules.includes('testimonials')) {
            fetches.push(
                (this.prisma as any).testimonial.findMany({
                    where: activeTheme ? { theme: activeTheme } : undefined,
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                }).then((testimonials: any[]) => {
                    // Normalise clientName/clientRole → name/role for theme compatibility
                    data.testimonials = testimonials.map((t: any) => ({
                        ...t,
                        name: t.clientName,
                        role: t.clientRole || null,
                        avatarUrl: t.clientPhoto || null,
                    }));
                }),
            );
        }

        if (enabledModules.includes('services')) {
            fetches.push(
                (this.prisma as any).service.findMany({
                    where: activeTheme ? { theme: activeTheme } : undefined,
                    orderBy: { order: 'asc' },
                }).then((services: any[]) => { data.services = services; }),
            );
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
                items: {
                    where: { isPublished: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!collection) throw new NotFoundException(`Collection '${slug}' not found`);
        return collection;
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

        try {
            const lead = await (this.prisma as any).lead.create({
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
}
