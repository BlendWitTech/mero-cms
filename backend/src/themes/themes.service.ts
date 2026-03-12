import { Injectable, BadRequestException } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { SetupService } from '../setup/setup.service';

const execAsync = promisify(exec);

@Injectable()
export class ThemesService {
    /** Themes uploaded via the UI (ZIP upload) */
    private readonly uploadPath = path.join(process.cwd(), 'uploads', 'themes');
    /**
     * Built-in themes shipped with the project.
     * In dev: project-root/themes/  (one level above backend/)
     * In Docker: set THEMES_DIR=/themes (volume-mounted from host)
     */
    private readonly builtInThemesPath =
        process.env.THEMES_DIR || path.join(process.cwd(), '..', 'themes');
    /** Media uploads directory */
    private readonly mediaUploadPath = path.join(process.cwd(), 'uploads');

    constructor(
        private prisma: PrismaService,
        private setupService: SetupService,
    ) {
        this.ensureDir(this.uploadPath);
        this.ensureDir(this.mediaUploadPath);
    }

    private ensureDir(dir: string) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    /** Check if a CMS module is enabled at runtime via ENABLED_MODULES env var. */
    private isModuleEnabled(...keys: string[]): boolean {
        const rawEnabled = (process.env.ENABLED_MODULES || '').trim();
        // If setup is not complete yet, all modules are considered enabled
        if (process.env.SETUP_COMPLETE !== 'true' || rawEnabled.length === 0) return true;
        const enabled = rawEnabled.split(',').map(s => s.trim()).filter(Boolean);
        return keys.some(k => enabled.includes(k));
    }

    /**
     * Find a theme directory: checks built-in themes first, then uploaded themes.
     * Returns null if not found in either location.
     */
    private findThemePath(name: string): string | null {
        const builtIn = path.join(this.builtInThemesPath, name);
        if (fs.existsSync(builtIn)) return builtIn;
        const uploaded = path.join(this.uploadPath, name);
        if (fs.existsSync(uploaded)) return uploaded;
        return null;
    }

    async processThemeUpload(file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
            throw new BadRequestException('Only zip files are allowed');
        }

        const themeName = path.parse(file.originalname).name;
        const extractPath = path.join(this.uploadPath, themeName);

        try {
            const zip = new AdmZip(file.buffer);
            zip.extractAllTo(extractPath, true);
            return { message: 'Theme uploaded and extracted successfully', themeName, path: extractPath };
        } catch (error) {
            throw new BadRequestException(`Failed to extract theme: ${error.message}`);
        }
    }

    /** List all theme names from both built-in and uploaded directories. */
    async listThemes(): Promise<string[]> {
        const themes: string[] = [];

        // Built-in themes from project root themes/ directory
        if (fs.existsSync(this.builtInThemesPath)) {
            const builtIn = fs.readdirSync(this.builtInThemesPath, { withFileTypes: true })
                .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
                .map(d => d.name);
            themes.push(...builtIn);
        }

        // Uploaded themes (skip duplicates already in built-in)
        if (fs.existsSync(this.uploadPath)) {
            const uploaded = fs.readdirSync(this.uploadPath, { withFileTypes: true })
                .filter(d => d.isDirectory() && !themes.includes(d.name))
                .map(d => d.name);
            themes.push(...uploaded);
        }

        return themes;
    }

    async setupTheme(themeName: string, importDemoContent: boolean = true) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const configPath = path.join(themePath, 'theme.json');
        if (!fs.existsSync(configPath)) {
            throw new BadRequestException(`Theme "${themeName}" is missing theme.json`);
        }

        try {
            await this.installDependencies(themePath);

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            // Support both `seedData` (new) and `seed` (legacy) keys, or the root object
            const seed = config.seedData || config.seed || {};

            const results: Record<string, number> = {
                posts: 0,
                pages: 0,
                menus: 0,
                categories: 0,
                projects: 0,
                team: 0,
                testimonials: 0,
                services: 0,
                milestones: 0,
                media: 0,
            };

            if (importDemoContent) {
                if (this.isModuleEnabled('blogs') && seed.posts?.length) {
                    results.posts = await this.setupPosts(seed.posts);
                }
                if (this.isModuleEnabled('pages') && seed.pages?.length) {
                    results.pages = await this.setupPages(seed.pages);
                }
                if (this.isModuleEnabled('menus') && seed.menus?.length) {
                    results.menus = await this.setupMenus(seed.menus);
                }
                if (this.isModuleEnabled('projects', 'project-categories') && seed.projectCategories?.length) {
                    results.categories = await this.setupProjectCategories(seed.projectCategories);
                }
                if (this.isModuleEnabled('projects') && seed.projects?.length) {
                    results.projects = await this.setupProjects(seed.projects);
                }
                if (this.isModuleEnabled('team') && seed.team?.length) {
                    results.team = await this.setupTeam(seed.team);
                }
                if (this.isModuleEnabled('testimonials') && seed.testimonials?.length) {
                    results.testimonials = await this.setupTestimonials(seed.testimonials);
                }
                if (this.isModuleEnabled('services') && seed.services?.length) {
                    results.services = await this.setupServices(seed.services);
                }
                if (this.isModuleEnabled('timeline') && seed.milestones?.length) {
                    results.milestones = await this.setupMilestones(seed.milestones);
                }

                // Import media files from theme's media/ directory
                results.media = await this.setupMedia(themePath, seed.media || []);
            }

            return { message: `Theme "${themeName}" setup completed`, results };
        } catch (error) {
            console.error("SetupTheme Error:", error);
            throw new BadRequestException(`Failed to setup theme: ${error.message}`);
        }
    }

    async getThemeDetails(themeName: string) {
        const themePath = this.findThemePath(themeName);

        let config: Record<string, any> = {};
        if (themePath) {
            const configPath = path.join(themePath, 'theme.json');
            if (fs.existsSync(configPath)) {
                try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { }
            }
        }

        const previewFile = themePath && (
            fs.existsSync(path.join(themePath, 'preview.png')) ? 'preview.png' :
            fs.existsSync(path.join(themePath, 'preview.jpg')) ? 'preview.jpg' :
            fs.existsSync(path.join(themePath, 'preview.svg')) ? 'preview.svg' : null
        );

        // Uploaded themes' previews are served via express static;
        // built-in themes use a served /themes-preview route (or null if no preview image)
        let previewUrl: string | null = null;
        if (previewFile && themePath) {
            const isBuiltIn = themePath.startsWith(this.builtInThemesPath);
            previewUrl = isBuiltIn
                ? `/themes-preview/${themeName}/${previewFile}`
                : `/uploads/themes/${themeName}/${previewFile}`;
        }

        return {
            name: config.name || themeName,
            slug: config.slug || themeName,
            version: config.version || '1.0.0',
            description: config.description || '',
            author: config.author || '',
            requiredModules: config.modules || config.requiredModules || [],
            previewUrl,
            deployedUrl: config.deployedUrl || '',
            builtIn: !!(themePath && themePath.startsWith(this.builtInThemesPath)),
        };
    }

    async prepareThemeModules(themeName: string) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const configPath = path.join(themePath, 'theme.json');
        if (!fs.existsSync(configPath)) {
            throw new BadRequestException(`Theme "${themeName}" is missing theme.json`);
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const requiredModules: string[] = config.modules || config.requiredModules || [];

        const enabledModules = await this.setupService.getEnabledModules();
        const missingModules = requiredModules.filter(rm => !enabledModules.includes(rm));

        if (missingModules.length > 0) {
            const allModules = [...new Set([...enabledModules, ...missingModules])];
            // This rebuilds the Prisma schema, runs db push, and sets a 1.5s timeout to process.exit(0)
            await this.setupService.updateEnabledModules(allModules);
            return { missingModules, needsRestart: true };
        }

        return { missingModules: [], needsRestart: false };
    }

    async listThemesWithDetails() {
        const names = await this.listThemes();
        return Promise.all(names.map(name => this.getThemeDetails(name)));
    }

    async setDeployedUrl(themeName: string, url: string) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const configPath = path.join(themePath, 'theme.json');
        let config: Record<string, any> = {};
        if (fs.existsSync(configPath)) {
            try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { }
        }

        config.deployedUrl = url;
        config.name = config.name || themeName;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

        await (this.prisma as any).setting.upsert({
            where: { key: `theme_url_${themeName}` },
            create: { key: `theme_url_${themeName}`, value: url },
            update: { value: url },
        });

        return { deployedUrl: url };
    }

    private async setupPosts(posts: any[]): Promise<number> {
        let count = 0;
        const author = await (this.prisma as any).user.findFirst();
        if (!author) return 0;
        const activeTheme = await this.getActiveTheme();

        for (const post of posts) {
            const existing = await (this.prisma as any).post.findUnique({ where: { slug: post.slug } });
            if (existing) continue;

            await (this.prisma as any).post.create({
                data: {
                    ...post,
                    authorId: author.id,
                    status: (post.status || 'PUBLISHED').toUpperCase(),
                },
            });
            count++;
        }
        return count;
    }

    private async setupPages(pages: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const page of pages) {
            const existing = await (this.prisma as any).page.findUnique({ where: { slug: page.slug } });
            if (existing) continue;

            await (this.prisma as any).page.create({
                data: {
                    ...page,
                    theme: activeTheme,
                    status: (page.status || 'PUBLISHED').toUpperCase(),
                },
            });
            count++;
        }
        return count;
    }

    private async setupMenus(menus: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const menuData of menus) {
            const { items, ...menu } = menuData;
            const existing = await (this.prisma as any).menu.findUnique({ where: { slug: menu.slug } });
            if (existing) continue;

            const createdMenu = await (this.prisma as any).menu.create({
                data: {
                    ...menu,
                    theme: activeTheme,
                },
            });

            if (items && items.length > 0) {
                for (const item of items) {
                    await (this.prisma as any).menuItem.create({
                        data: {
                            ...item,
                            menuId: createdMenu.id,
                        },
                    });
                }
            }
            count++;
        }
        return count;
    }

    private async setupProjectCategories(categories: any[]): Promise<number> {
        let count = 0;
        for (const cat of categories) {
            const existing = await (this.prisma as any).projectCategory.findUnique({ where: { slug: cat.slug } });
            if (existing) continue;

            await (this.prisma as any).projectCategory.create({ data: cat });
            count++;
        }
        return count;
    }

    private async setupProjects(projects: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const projectData of projects) {
            const { category, ...project } = projectData;
            const existing = await (this.prisma as any).project.findUnique({ where: { slug: project.slug } });
            if (existing) continue;

            let categoryId = null;
            if (category) {
                const catRecord = await (this.prisma as any).projectCategory.findUnique({ where: { slug: category } });
                if (catRecord) categoryId = catRecord.id;
            }

            await (this.prisma as any).project.create({
                data: {
                    ...project,
                    theme: activeTheme,
                    categoryId,
                    status: project.status || 'COMPLETED',
                },
            });
            count++;
        }
        return count;
    }

    private async setupTeam(team: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const member of team) {
            await (this.prisma as any).teamMember.create({
                data: {
                    ...member,
                    socialLinks: member.socialLinks || {},
                    theme: activeTheme,
                },
            });
            count++;
        }
        return count;
    }

    private async setupTestimonials(testimonials: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const test of testimonials) {
            const { name, ...rest } = test;
            await (this.prisma as any).testimonial.create({
                data: {
                    ...rest,
                    clientName: name,
                    theme: activeTheme,
                },
            });
            count++;
        }
        return count;
    }

    private async setupServices(services: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const service of services) {
            await (this.prisma as any).service.create({
                data: {
                    ...service,
                    processSteps: service.processSteps || [],
                    theme: activeTheme,
                },
            });
            count++;
        }
        return count;
    }

    private async setupMilestones(milestones: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const milestone of milestones) {
            await (this.prisma as any).milestone.create({
                data: {
                    ...milestone,
                    theme: activeTheme,
                },
            });
            count++;
        }
        return count;
    }

    async setActiveTheme(themeName: string, clearData: boolean = false, importDemoContent: boolean = false) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const previousTheme = await this.getActiveTheme();

        if (clearData) {
            await this.purgeDatabase(previousTheme);
        }

        if (clearData && importDemoContent) {
            await this.setupTheme(themeName, true);
        } else {
            await this.installDependencies(themePath);
        }

        // Always apply the theme's defaultSettings so the admin has correct
        // branding (site title, tagline, contact placeholders) immediately.
        const activateConfigPath = path.join(themePath, 'theme.json');
        if (fs.existsSync(activateConfigPath)) {
            try {
                const activateConfig = JSON.parse(fs.readFileSync(activateConfigPath, 'utf8'));
                await this.applyDefaultSettings(activateConfig.defaultSettings || {});
            } catch {}
        }

        await this.prisma.setting.upsert({
            where: { key: 'active_theme' },
            create: { key: 'active_theme', value: themeName },
            update: { value: themeName },
        });

        return { message: `Theme "${themeName}" is now active` };
    }

    private async installDependencies(themePath: string) {
        if (!fs.existsSync(path.join(themePath, 'node_modules'))) {
            try {
                await execAsync('npm install', { cwd: themePath });
            } catch (error) {
                console.error(`Failed to install dependencies for ${themePath}:`, error);
                throw new BadRequestException('Failed to install theme dependencies');
            }
        }
    }

    private async purgeDatabase(themeName?: string | null) {
        try {
            const filter = themeName ? { theme: themeName } : {};

            if (this.isModuleEnabled('blogs')) {
                // Posts are global, they don't have a theme tag currently. Avoid purging all posts if possible?
                // Or if we must, just purge. Since the prompt didn't ask to add theme to Post, we'll leave it as is.
                if (!themeName) await (this.prisma as any).post.deleteMany({});
            }
            if (this.isModuleEnabled('pages')) {
                await (this.prisma as any).page.deleteMany({ where: filter });
            }
            if (this.isModuleEnabled('menus')) {
                const menusToDelete = await (this.prisma as any).menu.findMany({ where: filter });
                const menuIds = menusToDelete.map((m: any) => m.id);
                if (menuIds.length > 0) {
                    await (this.prisma as any).menuItem.deleteMany({ where: { menuId: { in: menuIds } } });
                    await (this.prisma as any).menu.deleteMany({ where: filter });
                }
            }
            if (this.isModuleEnabled('projects')) {
                await (this.prisma as any).project.deleteMany({ where: filter });
                // Categories don't have theme tag currently.
                if (this.isModuleEnabled('project-categories') && !themeName) {
                    await (this.prisma as any).projectCategory.deleteMany({});
                }
            }
            if (this.isModuleEnabled('team')) {
                await (this.prisma as any).teamMember.deleteMany({ where: filter });
            }
            if (this.isModuleEnabled('testimonials')) {
                await (this.prisma as any).testimonial.deleteMany({ where: filter });
            }
            if (this.isModuleEnabled('services')) {
                await (this.prisma as any).service.deleteMany({ where: filter });
            }
            if (this.isModuleEnabled('timeline')) {
                await (this.prisma as any).milestone.deleteMany({ where: filter });
            }
        } catch (e) {
            console.error('Failed to purge database:', e);
            throw new BadRequestException('Failed to clear old data');
        }
    }

    async getActiveTheme() {
        const setting = await this.prisma.setting.findUnique({ where: { key: 'active_theme' } });
        return setting ? setting.value : null;
    }

    /** Return the active theme's full config (theme.json) minus seedData. */
    async getActiveThemeConfig(): Promise<Record<string, any> | null> {
        const name = await this.getActiveTheme();
        if (!name) return null;
        const themePath = this.findThemePath(name);
        if (!themePath) return null;
        const configPath = path.join(themePath, 'theme.json');
        if (!fs.existsSync(configPath)) return null;
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const { seedData, ...rest } = config;
            return rest;
        } catch { return null; }
    }

    /** Return the active theme's page schema (for the section editor). */
    async getPageSchema(): Promise<any[]> {
        const config = await this.getActiveThemeConfig();
        return config?.pageSchema || [];
    }

    /** Return module aliases (e.g. { projects: 'Plots' }). */
    async getModuleAliases(): Promise<Record<string, string>> {
        const config = await this.getActiveThemeConfig();
        return config?.moduleAliases || {};
    }

    /** Apply theme default settings — only sets keys that have no value yet. */
    private async applyDefaultSettings(defaults: Record<string, string>): Promise<void> {
        for (const [key, value] of Object.entries(defaults)) {
            if (!value) continue; // skip empty placeholder values
            // Only upsert — never overwrite if user already has a value set
            const existing = await this.prisma.setting.findUnique({ where: { key } });
            if (!existing || !existing.value) {
                await this.prisma.setting.upsert({
                    where: { key },
                    create: { key, value },
                    update: { value },
                });
            }
        }
    }

    /**
     * Import media files from {themePath}/media/ into the CMS media library.
     * Copies files to uploads/ and creates Media DB records.
     * Skips files already present in the DB.
     */
    private async setupMedia(themePath: string, explicitItems: any[]): Promise<number> {
        const mediaDir = path.join(themePath, 'media');
        if (!fs.existsSync(mediaDir)) return 0;

        const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']);
        const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi']);

        const files = fs.readdirSync(mediaDir).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext);
        });

        let count = 0;
        for (const file of files) {
            const srcPath = path.join(mediaDir, file);
            const destPath = path.join(this.mediaUploadPath, file);

            // Copy to uploads if not already there
            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(srcPath, destPath);
            }

            // Skip if DB record already exists for this filename
            const existing = await (this.prisma as any).media.findFirst({ where: { filename: file } });
            if (existing) continue;

            const stat = fs.statSync(destPath);
            const ext = path.extname(file).toLowerCase();
            const explicitMeta = explicitItems.find((m: any) => m.filename === file) || {};

            await (this.prisma as any).media.create({
                data: {
                    filename: file,
                    url: `/uploads/${file}`,
                    mimetype: this.getMimeType(ext),
                    size: stat.size,
                    altText: explicitMeta.altText || null,
                    folder: 'theme-assets',
                },
            });
            count++;
        }
        return count;
    }

    private getMimeType(ext: string): string {
        const map: Record<string, string> = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
            '.avif': 'image/avif', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
            '.webm': 'video/webm', '.avi': 'video/x-msvideo',
        };
        return map[ext] || 'application/octet-stream';
    }
}
