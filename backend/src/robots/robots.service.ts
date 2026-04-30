import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class RobotsService {
    constructor(
        private prisma: PrismaService,
        // SettingsService.getSiteUrl() — DB-first source of truth for
        // the public site URL. Used to print absolute Sitemap: lines
        // in the default robots.txt.
        private settings: SettingsService,
    ) { }

    async getRobotsTxt() {
        const robot = await this.prisma.robotsTxt.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        if (!robot) {
            // Return default robots.txt
            return await this.getDefaultRobotsTxt();
        }

        return robot.content;
    }

    async updateRobotsTxt(content: string) {
        // Deactivate all existing robots.txt
        await this.prisma.robotsTxt.updateMany({
            data: { isActive: false },
        });

        // Create new active robots.txt
        return this.prisma.robotsTxt.create({
            data: {
                content,
                isActive: true,
            },
        });
    }

    async getConfig() {
        return this.prisma.robotsTxt.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    private async getDefaultRobotsTxt(): Promise<string> {
        const baseUrl = await this.settings.getSiteUrl();

        return `# Mero CMS - Robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-index.xml

# Disallow admin areas
Disallow: /dashboard/
Disallow: /login/
Disallow: /api/
`;
    }
}
