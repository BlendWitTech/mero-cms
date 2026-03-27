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

    async setupTheme(themeName: string, clearPrevious: boolean = false) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        try {
            if (clearPrevious) {
                const previousTheme = await this.getActiveTheme();
                await this.purgeDatabase(previousTheme);
                
                // Also clear node_modules if it exists for a truly fresh start
                const nodeModulesPath = path.join(themePath, 'node_modules');
                if (fs.existsSync(nodeModulesPath)) {
                    try {
                        await execAsync(process.platform === 'win32' ? `rmdir /s /q "${nodeModulesPath}"` : `rm -rf "${nodeModulesPath}"`);
                    } catch (e) {}
                }
            }

            await this.installDependencies(themePath);

            // Track setup type in settings
            const setupType = clearPrevious ? 'FRESH' : 'LEGACY';
            await this.prisma.setting.upsert({
                where: { key: `theme_setup_type_${themeName}` },
                create: { key: `theme_setup_type_${themeName}`, value: setupType },
                update: { value: setupType },
            });

            return { message: `Theme "${themeName}" setup completed as ${setupType}` };
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

        let previewUrl: string | null = null;
        if (previewFile && themePath) {
            const isBuiltIn = themePath.startsWith(this.builtInThemesPath);
            previewUrl = isBuiltIn
                ? `/themes-preview/${themeName}/${previewFile}`
                : `/uploads/themes/${themeName}/${previewFile}`;
        }

        const setupTypeSetting = await this.prisma.setting.findUnique({
            where: { key: `theme_setup_type_${themeName}` }
        });

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
            setupType: setupTypeSetting?.value || null,
        };
    }

    async prepareThemeModules(themeName: string) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const configPath = path.join(themePath, 'theme.json');
        if (!fs.existsSync(configPath)) {
            throw new BadRequestException(`Theme "${themeName}" is missing theme.json`);
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
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

    private async setupBlogCategories(categories: any[]): Promise<number> {
        let count = 0;
        for (const cat of categories) {
            const existing = await (this.prisma as any).category.findUnique({ where: { slug: cat.slug } });
            if (existing) continue;
            await (this.prisma as any).category.create({
                data: { name: cat.name, slug: cat.slug, description: cat.description || null },
            });
            count++;
        }
        return count;
    }

    private async setupPosts(posts: any[]): Promise<number> {
        let count = 0;
        const author = await (this.prisma as any).user.findFirst();
        if (!author) return 0;

        for (const post of posts) {
            const existing = await (this.prisma as any).post.findUnique({ where: { slug: post.slug } });
            if (existing) continue;

            // Strip non-Prisma fields; handle category slug → relation connect
            const { category, categories, tags, ...postData } = post;

            // Resolve category slug(s) → connect array
            const categoryConnect: { slug: string }[] = [];
            if (category && typeof category === 'string') categoryConnect.push({ slug: category });
            if (Array.isArray(categories)) categories.forEach((c: string) => categoryConnect.push({ slug: c }));

            await (this.prisma as any).post.create({
                data: {
                    ...postData,
                    authorId: author.id,
                    status: (post.status || 'PUBLISHED').toUpperCase(),
                    ...(categoryConnect.length > 0 && { categories: { connect: categoryConnect } }),
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



    private async setupPlotCategories(categories: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const cat of categories) {
            const existing = await (this.prisma as any).plotCategory.findUnique({ where: { slug: cat.slug } });
            if (existing) continue;
            await (this.prisma as any).plotCategory.create({
                data: { name: cat.name, slug: cat.slug, description: cat.description || null, theme: activeTheme },
            });
            count++;
        }
        return count;
    }

    private async setupPlots(plots: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const p of plots) {
            const slug = p.slug || p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const existing = await (this.prisma as any).plot.findUnique({ where: { slug } });
            if (existing) continue;

            let categoryId: string | null = null;
            if (p.category && typeof p.category === 'string') {
                const cat = await (this.prisma as any).plotCategory.findFirst({ where: { slug: p.category } });
                categoryId = cat?.id ?? null;
            } else if (p.categoryId) {
                categoryId = p.categoryId;
            }

            await (this.prisma as any).plot.create({
                data: {
                    title:       p.title,
                    slug,
                    description: p.description || '',
                    content:     p.content     || null,
                    coverImage:  p.coverImage  || p.featuredImage || null,
                    gallery:     p.gallery     || [],
                    status:      p.status      || 'available',
                    location:    p.location    || null,
                    featured:    p.featured    ?? false,
                    priceFrom:   p.priceFrom   || null,
                    priceTo:     p.priceTo     || null,
                    areaFrom:    p.areaFrom    || null,
                    areaTo:      p.areaTo      || null,
                    facing:      p.facing      || null,
                    roadAccess:  p.roadAccess  || null,
                    theme:       activeTheme,
                    categoryId,
                    attributes:  p.attributes  || {},
                },
            });
            count++;
        }
        return count;
    }

    private async setupTeam(team: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const m of team) {
            const existing = await (this.prisma as any).teamMember.findFirst({ where: { name: m.name } });
            if (existing) continue;
            await (this.prisma as any).teamMember.create({
                data: {
                    name:        m.name,
                    role:        m.role,
                    bio:         m.bio         || null,
                    image:       m.image       || null,
                    order:       m.order       ?? 0,
                    socialLinks: m.socialLinks || {},
                    theme:       activeTheme,
                    attributes:  m.attributes  || {},
                },
            });
            count++;
        }
        return count;
    }

    private async setupTestimonials(testimonials: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const t of testimonials) {
            const existing = await (this.prisma as any).testimonial.findFirst({
                where: { clientName: t.clientName || t.name },
            });
            if (existing) continue;
            // Map theme.json fields → Prisma column names; strip unknown keys
            await (this.prisma as any).testimonial.create({
                data: {
                    clientName:    t.clientName    || t.name,
                    clientRole:    t.clientRole    || t.role    || null,
                    clientCompany: t.clientCompany || null,
                    content:       t.content,
                    rating:        t.rating        ?? 5,
                    clientPhoto:   t.clientPhoto   || t.avatarUrl || null,
                    theme:         activeTheme,
                    attributes:    t.attributes    || {},
                },
            });
            count++;
        }
        return count;
    }

    private async setupServices(services: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const s of services) {
            const existing = await (this.prisma as any).service.findFirst({ where: { title: s.title } });
            if (existing) continue;
            await (this.prisma as any).service.create({
                data: {
                    title:        s.title,
                    description:  s.description  || null,
                    icon:         s.icon         || null,
                    order:        s.order        ?? 0,
                    processSteps: s.processSteps || [],
                    theme:        activeTheme,
                    attributes:   s.attributes   || {},
                },
            });
            count++;
        }
        return count;
    }


    async setActiveTheme(themeName: string, importDemoContent: boolean = false) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const results: Record<string, number> = {};

        // Set active_theme FIRST so all seed helpers pick up the correct theme
        await this.prisma.setting.upsert({
            where: { key: 'active_theme' },
            create: { key: 'active_theme', value: themeName },
            update: { value: themeName },
        });

        if (importDemoContent) {
            const setupType = await this.prisma.setting.findUnique({
                where: { key: `theme_setup_type_${themeName}` }
            });
            
            if (setupType?.value === 'FRESH') {
                const configPath = path.join(themePath, 'theme.json');
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
                const seed = config.seedData || config.seed || {};

                // Seed blog categories BEFORE posts so category FK resolves
                if (this.isModuleEnabled('blogs') && seed.blogCategories?.length) results.blogCategories = await this.setupBlogCategories(seed.blogCategories);
                if (this.isModuleEnabled('blogs') && seed.posts?.length) results.posts = await this.setupPosts(seed.posts);
                if (this.isModuleEnabled('pages') && seed.pages?.length) results.pages = await this.setupPages(seed.pages);
                if (this.isModuleEnabled('menus') && seed.menus?.length) results.menus = await this.setupMenus(seed.menus);
                // Seed project categories BEFORE projects so FK resolves
                if (this.isModuleEnabled('plot-categories') && seed.plotCategories?.length) results.plotCategories = await this.setupPlotCategories(seed.plotCategories);
                if (this.isModuleEnabled('plots') && seed.plots?.length) results.plots = await this.setupPlots(seed.plots);
                if (this.isModuleEnabled('team') && seed.team?.length) results.team = await this.setupTeam(seed.team);
                if (this.isModuleEnabled('testimonials') && seed.testimonials?.length) results.testimonials = await this.setupTestimonials(seed.testimonials);
                if (this.isModuleEnabled('services') && seed.services?.length) results.services = await this.setupServices(seed.services);

                results.media = await this.setupMedia(themePath, seed.media || []);

                // Mark as LEGACY so demo content is never re-imported on subsequent activations
                await this.prisma.setting.upsert({
                    where: { key: `theme_setup_type_${themeName}` },
                    create: { key: `theme_setup_type_${themeName}`, value: 'LEGACY' },
                    update: { value: 'LEGACY' },
                });
            }
        }

        // Always apply default settings
        const activateConfigPath = path.join(themePath, 'theme.json');
        if (fs.existsSync(activateConfigPath)) {
            try {
                const activateConfig = JSON.parse(fs.readFileSync(activateConfigPath, 'utf8'));
                await this.applyDefaultSettings(activateConfig.defaultSettings || {});
            } catch {}
        }

        return { message: `Theme "${themeName}" activated`, results };
    }

    /**
     * Install theme npm dependencies in the background.
     * Does not block the HTTP request — the CMS backend doesn't need the theme's
     * node_modules to function. They're only needed when the theme frontend runs.
     */
    private installDependencies(themePath: string): void {
        if (fs.existsSync(path.join(themePath, 'node_modules'))) return;
        execAsync('npm install', { cwd: themePath })
            .then(() => console.log(`[Themes] Dependencies installed for ${themePath}`))
            .catch(e => console.error(`[Themes] npm install failed (non-fatal): ${e.message}`));
    }

    private async purgeDatabase(themeName?: string | null) {
        try {
            // Filter by theme if possible, otherwise we might need to be more selective
            // Site Pages and Menus definitely have theme tags.
            const filter = themeName ? { theme: themeName } : {};

            if (this.isModuleEnabled('blogs')) {
                // If we're doing a clean setup, we might want to clear posts if they are theme-specific
                // or if the user wants a TRULY clean state. But posts don't have theme yet.
                // However, point 8 says "database content in the Site PAges and all should be removed"
                // For now, let's keep posts unless it's a GLOBAL clean (no themeName), which isn't the case here.
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
            
            // Purge other modules that support theme isolation
            const dynamicModules = ['plot', 'plotCategory', 'teamMember', 'testimonial', 'service'];
            for (const mod of dynamicModules) {
                try {
                    if ((this.prisma as any)[mod]) {
                        await (this.prisma as any)[mod].deleteMany({ where: filter });
                    }
                } catch (e) {
                    // Module might not exist in Prisma yet if not fully migrated
                }
            }

            // Media is trickier since files are on disk. We'll leave it for now to avoid breaking other things.
        } catch (e) {
            console.error('Failed to purge database:', e);
            throw new BadRequestException('Failed to clear old data');
        }
    }

    async getActiveTheme() {
        const setting = await this.prisma.setting.findUnique({ where: { key: 'active_theme' } });
        return setting ? setting.value : null;
    }

    async deleteTheme(themeName: string) {
        const builtInPath = path.join(this.builtInThemesPath, themeName);
        const uploadedPath = path.join(this.uploadPath, themeName);

        const themePath = fs.existsSync(builtInPath)
            ? builtInPath
            : fs.existsSync(uploadedPath)
                ? uploadedPath
                : null;

        if (!themePath) {
            throw new BadRequestException(`Theme "${themeName}" not found.`);
        }

        // If this theme is currently active, clear the active_theme setting
        const active = await this.getActiveTheme();
        if (active === themeName) {
            await this.prisma.setting.deleteMany({ where: { key: 'active_theme' } });
        }

        fs.rmSync(themePath, { recursive: true, force: true });
        return { deleted: themeName };
    }

    /**
     * Reset the CMS to its base state:
     * - Wipes ALL content (pages, menus, plots, team, testimonials, services, posts, leads, media records)
     * - Removes theme-related settings (active_theme, all theme_setup_type_* and theme_url_* keys,
     *   and site-level settings that themes customise like primary_color, site_title etc.)
     * - Keeps: users, roles, system settings (enabled_modules, setup_complete, cms_*)
     */
    async resetToBaseState(): Promise<{ cleared: Record<string, number> }> {
        const cleared: Record<string, number> = {};

        // 1. Clear all content tables
        const contentModels = [
            'menuItem', 'menu',
            'page',
            'teamMember',
            'testimonial',
            'service',
            'plotCategory', 'plot',
            'lead',
            'notification',
            'seoMeta',
            'media',
        ];

        for (const model of contentModels) {
            try {
                if ((this.prisma as any)[model]) {
                    const result = await (this.prisma as any)[model].deleteMany({});
                    cleared[model] = result.count;
                }
            } catch (e) {
                // Model may not exist in current schema — skip
            }
        }

        // Posts: cascade deletes comments via FK
        try {
            await (this.prisma as any).comment?.deleteMany({});
            const posts = await (this.prisma as any).post?.deleteMany({});
            if (posts) cleared['post'] = posts.count;
        } catch (e) {}

        // 2. Clear all theme/site settings — keep only core system keys
        const keepKeys = ['enabled_modules', 'setup_complete', 'cms_title', 'cms_subtitle', 'cms_login_avatar'];
        const removed = await (this.prisma as any).setting.deleteMany({
            where: { key: { notIn: keepKeys } },
        });
        cleared['settings_removed'] = removed.count;

        return { cleared };
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
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
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

    async getModuleSchemas(): Promise<Record<string, any[]>> {
        const config = await this.getActiveThemeConfig();
        return (config as any)?.moduleSchemas || {};
    }
}
