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
            requiredModules: config.requiredModules || [],
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
        const requiredModules: string[] = config.requiredModules || [];

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

    async setActiveTheme(themeName: string, clearData: boolean = false, importDemoContent: boolean = false) {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        if (clearData) {
            await this.purgeDatabase();
        }

        if (clearData && importDemoContent) {
            await this.setupTheme(themeName, true);
        } else {
            await this.installDependencies(themePath);
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

    private async purgeDatabase() {
        try {
            if (this.isModuleEnabled('blogs')) {
                await (this.prisma as any).post.deleteMany({});
            }
            if (this.isModuleEnabled('pages')) {
                await (this.prisma as any).page.deleteMany({});
            }
            if (this.isModuleEnabled('menus')) {
                await (this.prisma as any).menuItem.deleteMany({});
                await (this.prisma as any).menu.deleteMany({});
            }
            if (this.isModuleEnabled('projects')) {
                await (this.prisma as any).project.deleteMany({});
                if (this.isModuleEnabled('project-categories')) {
                    await (this.prisma as any).projectCategory.deleteMany({});
                }
            }
            if (this.isModuleEnabled('team')) {
                await (this.prisma as any).teamMember.deleteMany({});
            }
            if (this.isModuleEnabled('testimonials')) {
                await (this.prisma as any).testimonial.deleteMany({});
            }
            if (this.isModuleEnabled('services')) {
                await (this.prisma as any).service.deleteMany({});
            }
            if (this.isModuleEnabled('timeline')) {
                await (this.prisma as any).milestone.deleteMany({});
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

    // ── Seed helpers ─────────────────────────────────────────────────────────

    private async setupPosts(posts: any[]): Promise<number> {
        const admin = await this.prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
        if (!admin) return 0;

        for (const p of posts) {
            const slug = p.slug || p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const status = (p.status || 'published').toUpperCase();
            const publishedAt = status === 'PUBLISHED'
                ? (p.publishedAt ? new Date(p.publishedAt) : new Date())
                : null;

            await (this.prisma as any).post.upsert({
                where: { slug },
                update: {
                    title: p.title,
                    content: p.content || '',
                    excerpt: p.excerpt || null,
                    coverImage: p.coverImage || null,
                    status,
                    featured: p.featured || false,
                    publishedAt,
                },
                create: {
                    title: p.title,
                    slug,
                    content: p.content || '',
                    excerpt: p.excerpt || null,
                    coverImage: p.coverImage || null,
                    status,
                    authorId: admin.id,
                    featured: p.featured || false,
                    publishedAt,
                },
            });
        }
        return posts.length;
    }

    private async setupPages(pages: any[]): Promise<number> {
        for (const p of pages) {
            const slug = p.slug || p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            await (this.prisma as any).page.upsert({
                where: { slug },
                update: { title: p.title, content: p.content || '', status: 'PUBLISHED' },
                create: { title: p.title, slug, content: p.content || '', status: 'PUBLISHED' },
            });
        }
        return pages.length;
    }

    private async setupMenus(menus: any[]): Promise<number> {
        for (const menuConfig of menus) {
            const { items = [], ...menuData } = menuConfig;
            const slug = menuData.slug || menuData.name.toLowerCase().replace(/\s+/g, '-');

            let menu = await (this.prisma as any).menu.findUnique({ where: { slug } });
            if (menu) {
                await (this.prisma as any).menuItem.deleteMany({ where: { menuId: menu.id } });
                await (this.prisma as any).menu.update({ where: { id: menu.id }, data: { name: menuData.name } });
            } else {
                menu = await (this.prisma as any).menu.create({ data: { name: menuData.name, slug } });
            }

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                await (this.prisma as any).menuItem.create({
                    data: {
                        label: item.label,
                        url: item.url,
                        target: item.target || '_self',
                        order: item.order ?? i,
                        menuId: menu.id,
                    },
                });
            }
        }
        return menus.length;
    }

    private async setupProjectCategories(categories: any[]): Promise<number> {
        for (const cat of categories) {
            const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            await (this.prisma as any).projectCategory.upsert({
                where: { slug },
                update: { name: cat.name, description: cat.description || '' },
                create: { name: cat.name, slug, description: cat.description || '' },
            });
        }
        return categories.length;
    }

    private async setupProjects(projects: any[]): Promise<number> {
        for (const proj of projects) {
            const slug = proj.slug || proj.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

            // Resolve category slug → categoryId
            let categoryId: string | undefined;
            if (proj.category && typeof proj.category === 'string') {
                const cat = await (this.prisma as any).projectCategory.findFirst({ where: { slug: proj.category } });
                categoryId = cat?.id;
            } else if (proj.categoryId) {
                categoryId = proj.categoryId;
            }

            // Only include fields that exist in the Project Prisma model
            const data: any = {
                title: proj.title,
                description: proj.description || '',
                content: proj.content || null,
                coverImage: proj.coverImage || proj.featuredImage || null,
                featured: proj.featured ?? false,
                location: proj.location || null,
                status: proj.status || 'COMPLETED',
                // Real-estate specific fields (added in schema)
                priceFrom: proj.priceFrom || null,
                areaFrom: proj.areaFrom || null,
                areaTo: proj.areaTo || null,
            };
            if (categoryId) data.categoryId = categoryId;

            await (this.prisma as any).project.upsert({
                where: { slug },
                update: data,
                create: { ...data, slug },
            });
        }
        return projects.length;
    }

    private async setupTeam(team: any[]): Promise<number> {
        for (const member of team) {
            const data = {
                name: member.name,
                role: member.role,
                bio: member.bio || null,
                image: member.image || null,
                socialLinks: member.socialLinks || null,
                order: member.order || 0,
            };
            const existing = await (this.prisma as any).teamMember.findFirst({ where: { name: member.name } });
            if (existing) {
                await (this.prisma as any).teamMember.update({ where: { id: existing.id }, data });
            } else {
                await (this.prisma as any).teamMember.create({ data });
            }
        }
        return team.length;
    }

    private async setupTestimonials(testimonials: any[]): Promise<number> {
        for (const t of testimonials) {
            // Normalise field names: theme.json may use `name`/`role`/`avatarUrl`,
            // Prisma schema uses `clientName`/`clientRole`/`clientPhoto`
            const data: any = {
                clientName: t.clientName || t.name,
                clientRole: t.clientRole || t.role || null,
                clientCompany: t.clientCompany || null,
                content: t.content,
                rating: t.rating ?? 5,
                clientPhoto: t.clientPhoto || t.avatarUrl || null,
            };
            const existing = await (this.prisma as any).testimonial.findFirst({ where: { clientName: data.clientName } });
            if (existing) {
                await (this.prisma as any).testimonial.update({ where: { id: existing.id }, data });
            } else {
                await (this.prisma as any).testimonial.create({ data });
            }
        }
        return testimonials.length;
    }

    private async setupServices(services: any[]): Promise<number> {
        for (const s of services) {
            const data = {
                title: s.title,
                description: s.description || null,
                icon: s.icon || null,
                processSteps: s.processSteps || null,
                order: s.order || 0,
            };
            const existing = await (this.prisma as any).service.findFirst({ where: { title: s.title } });
            if (existing) {
                await (this.prisma as any).service.update({ where: { id: existing.id }, data });
            } else {
                await (this.prisma as any).service.create({ data });
            }
        }
        return services.length;
    }

    private async setupMilestones(milestones: any[]): Promise<number> {
        for (const m of milestones) {
            const data = {
                year: m.year,
                title: m.title,
                description: m.description || null,
                icon: m.icon || null,
                image: m.image || null,
                order: m.order || 0,
            };
            const existing = await (this.prisma as any).milestone.findFirst({ where: { title: m.title } });
            if (existing) {
                await (this.prisma as any).milestone.update({ where: { id: existing.id }, data });
            } else {
                await (this.prisma as any).milestone.create({ data });
            }
        }
        return milestones.length;
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
