import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SetupService } from '../setup/setup.service';

@Controller('public')
export class PublicController {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
        private setupService: SetupService,
    ) { }

    @Get('site-data')
    async getSiteData() {
        const [settingsMap, enabledModules] = await Promise.all([
            this.settingsService.findAll(),
            this.setupService.getEnabledModules(),
        ]);

        const data: Record<string, any> = {
            settings: {
                siteTitle: settingsMap['site_title'] || '',
                siteTagline: settingsMap['site_tagline'] || '',
                copyrightText: settingsMap['copyright_text'] || '',
                logoUrl: settingsMap['logo_url'] || '',
                faviconUrl: settingsMap['favicon_url'] || '',
                activeTheme: settingsMap['active_theme'] || null,
            },
            enabledModules,
        };

        const fetches: Promise<void>[] = [];

        if (enabledModules.includes('menus')) {
            fetches.push(
                (this.prisma as any).menu.findMany({
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
                    where: { status: 'PUBLISHED' },
                    select: { id: true, title: true, slug: true, description: true, content: true },
                }).then((pages: any[]) => { data.pages = pages; }),
            );
        }

        if (enabledModules.includes('projects')) {
            fetches.push(
                (this.prisma as any).project.findMany({
                    where: { status: 'PUBLISHED' },
                    include: { category: true },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                }).then((projects: any[]) => { data.projects = projects; }),
            );
        }

        if (enabledModules.includes('team')) {
            fetches.push(
                (this.prisma as any).teamMember.findMany({
                    orderBy: { order: 'asc' },
                }).then((team: any[]) => { data.team = team; }),
            );
        }

        if (enabledModules.includes('testimonials')) {
            fetches.push(
                (this.prisma as any).testimonial.findMany({
                    take: 20,
                }).then((testimonials: any[]) => { data.testimonials = testimonials; }),
            );
        }

        if (enabledModules.includes('services')) {
            fetches.push(
                (this.prisma as any).service.findMany({
                    orderBy: { order: 'asc' },
                }).then((services: any[]) => { data.services = services; }),
            );
        }

        if (enabledModules.includes('timeline')) {
            fetches.push(
                (this.prisma as any).milestone.findMany({
                    orderBy: { order: 'asc' },
                }).then((milestones: any[]) => { data.milestones = milestones; }),
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
                }).then((posts: any[]) => { data.recentPosts = posts; }),
            );
        }

        await Promise.all(fetches);
        return data;
    }
}
