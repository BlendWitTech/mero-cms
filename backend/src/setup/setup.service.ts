import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import * as bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export const CORE_MODULES = [
    'auth', 'users', 'roles', 'settings', 'media',
    'audit-log', 'mail', 'notifications', 'invitations', 'tasks',
];

export const OPTIONAL_MODULES = [
    'blogs', 'categories', 'tags', 'comments',
    'seo', 'redirects', 'analytics', 'sitemap', 'robots',
    'menus', 'pages', 'themes',
    'plots', 'plot-categories', 'team',
    'services', 'testimonials', 'leads',
];

export const MODULE_LABELS: Record<string, { label: string; description: string; group: string }> = {
    blogs: { label: 'Blog', description: 'Blog posts with categories, tags, and comments', group: 'Content' },
    categories: { label: 'Blog Categories', description: 'Categorize blog posts', group: 'Content' },
    tags: { label: 'Blog Tags', description: 'Tag blog posts for filtering', group: 'Content' },
    comments: { label: 'Comments', description: 'Reader comments on blog posts', group: 'Content' },
    plots: { label: 'Plots', description: 'Land plot listings for real-estate themes', group: 'Content' },
    'plot-categories': { label: 'Plot Categories', description: 'Categorize land plots', group: 'Content' },
    team: { label: 'Team', description: 'Team member profiles', group: 'Content' },
    services: { label: 'Services', description: 'Service offerings with process steps', group: 'Content' },
    testimonials: { label: 'Testimonials', description: 'Client reviews and testimonials', group: 'Content' },
    leads: { label: 'Lead Forms', description: 'Contact form lead capture and CRM', group: 'Marketing' },
    menus: { label: 'Navigation Menus', description: 'Dynamic nested menu management', group: 'Site' },
    pages: { label: 'Static Pages', description: 'Custom page management', group: 'Site' },
    themes: { label: 'Themes', description: 'Upload and manage website themes', group: 'Site' },
    seo: { label: 'SEO Tools', description: 'Meta tags, redirects, robots.txt, sitemap', group: 'SEO & Analytics' },
    redirects: { label: 'URL Redirects', description: 'Manage 301/302 redirects', group: 'SEO & Analytics' },
    analytics: { label: 'Analytics', description: 'Google Analytics 4 integration and dashboard', group: 'SEO & Analytics' },
    sitemap: { label: 'Sitemap', description: 'Auto-generated XML sitemap', group: 'SEO & Analytics' },
    robots: { label: 'Robots.txt', description: 'Manage search engine crawl rules', group: 'SEO & Analytics' },
};

@Injectable()
export class SetupService {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
    ) { }

    async isSetupComplete(): Promise<boolean> {
        try {
            const setting = await (this.prisma as any).setting.findUnique({
                where: { key: 'setup_complete' },
            });
            return setting?.value === 'true';
        } catch {
            // DB tables don't exist yet (fresh install before first db push)
            return false;
        }
    }

    async getEnabledModules(): Promise<string[]> {
        try {
            const setting = await (this.prisma as any).setting.findUnique({
                where: { key: 'enabled_modules' },
            });
            if (!setting) return [...CORE_MODULES];
            return JSON.parse(setting.value);
        } catch {
            return [...CORE_MODULES];
        }
    }

    async completeSetup(data: {
        siteName: string;
        adminEmail: string;
        adminPassword: string;
        adminName: string;
        enabledModules: string[];
    }) {
        const alreadyComplete = await this.isSetupComplete();
        if (alreadyComplete) {
            throw new BadRequestException('Setup has already been completed');
        }

        // Resolve paths: __dirname = dist/setup or src/setup → up to backend root
        const backendRoot = path.join(__dirname, '..', '..');
        const projectRoot = path.join(backendRoot, '..');
        // In Docker, set SCRIPTS_DIR=/scripts (volume-mounted); in dev it falls back to ../scripts
        const scriptsDir = process.env.SCRIPTS_DIR || path.join(projectRoot, 'scripts');
        const buildScriptPath = path.join(scriptsDir, 'build-schema.js');

        // 1. Assemble minimal schema for selected modules
        const moduleList = data.enabledModules.join(',');
        console.log(`[Setup] Building schema for modules: ${moduleList || '(core only)'}`);
        execSync(`node "${buildScriptPath}" ${moduleList}`, {
            cwd: backendRoot,
            stdio: 'inherit',
        });

        // 2. Push schema to DB — creates only the needed tables
        console.log('[Setup] Running prisma db push...');
        execSync('npx prisma db push --accept-data-loss', {
            cwd: backendRoot,
            stdio: 'inherit',
        });

        // 3. Create Super Admin role if it doesn't exist
        let superAdminRole = await (this.prisma as any).role.findFirst({
            where: { name: 'Super Admin' },
        });
        if (!superAdminRole) {
            superAdminRole = await (this.prisma as any).role.create({
                data: {
                    name: 'Super Admin',
                    level: 0,
                    permissions: { all: true },
                },
            });
        }

        // 4. Create admin user if none exist
        const existingUser = await (this.prisma as any).user.findFirst();
        if (!existingUser) {
            const hashed = await bcrypt.hash(data.adminPassword, 10);
            await (this.prisma as any).user.create({
                data: {
                    email: data.adminEmail,
                    name: data.adminName,
                    password: hashed,
                    status: 'ACTIVE',
                    roleId: superAdminRole.id,
                },
            });
        }

        // 5. Store enabled modules in DB settings
        const allModules = [...new Set([...CORE_MODULES, ...data.enabledModules])];
        await this.settingsService.updateMany({
            site_title: data.siteName,
            enabled_modules: JSON.stringify(allModules),
            setup_complete: 'true',
        });

        // 6. Write ENABLED_MODULES to .env so it persists after restart
        this.writeEnvVars(backendRoot, {
            ENABLED_MODULES: data.enabledModules.join(','),
            SETUP_COMPLETE: 'true',
        });

        console.log('[Setup] Complete. Server will restart in 1.5s...');
        // 7. Trigger restart — nodemon/Docker/PM2 will bring the server back up
        setTimeout(() => process.exit(0), 1500);

        return { success: true, enabledModules: allModules, needsRestart: true };
    }

    async updateEnabledModules(modules: string[]) {
        const allModules = [...new Set([...CORE_MODULES, ...modules])];

        const backendRoot = path.join(__dirname, '..', '..');
        const projectRoot = path.join(backendRoot, '..');
        const scriptsDir2 = process.env.SCRIPTS_DIR || path.join(projectRoot, 'scripts');
        const buildScriptPath = path.join(scriptsDir2, 'build-schema.js');

        const moduleList = modules.join(',');
        console.log(`[Setup] Updating schema for modules: ${moduleList}`);
        execSync(`node "${buildScriptPath}" ${moduleList}`, {
            cwd: backendRoot,
            stdio: 'inherit',
        });
        execSync('npx prisma db push --accept-data-loss', {
            cwd: backendRoot,
            stdio: 'inherit',
        });

        await this.settingsService.update('enabled_modules', JSON.stringify(allModules));

        this.writeEnvVars(backendRoot, {
            ENABLED_MODULES: modules.join(','),
        });

        setTimeout(() => process.exit(0), 1500);

        return { enabledModules: allModules, needsRestart: true };
    }

    private writeEnvVars(backendRoot: string, vars: Record<string, string>) {
        const envPath = path.join(backendRoot, '.env');
        let content = '';
        try {
            content = fs.readFileSync(envPath, 'utf8');
        } catch {
            content = '';
        }

        for (const [key, value] of Object.entries(vars)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(content)) {
                content = content.replace(regex, `${key}="${value}"`);
            } else {
                content = content.trimEnd() + `\n${key}="${value}"\n`;
            }
        }

        fs.writeFileSync(envPath, content, 'utf8');
    }
}
