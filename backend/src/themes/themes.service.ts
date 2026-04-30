import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { SetupService } from '../setup/setup.service';
import { SetupProgressService } from '../setup/setup-progress.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { getActiveTier } from '../auth/tier.enum';
import { PACKAGES } from '../config/packages';

const execAsync = promisify(exec);

@Injectable()
export class ThemesService {
    /** Themes uploaded via the UI (ZIP upload) */
    private readonly builtInThemesPath =
        process.env.THEMES_DIR || path.join(process.cwd(), '..', 'themes');
    /** Themes uploaded via the UI (ZIP upload) — now merged into the built-in themes directory */
    private readonly uploadPath = this.builtInThemesPath;
    /** Media uploads directory */
    private readonly mediaUploadPath = path.join(process.cwd(), 'uploads');

    constructor(
        private prisma: PrismaService,
        private setupService: SetupService,
        private webhooksService: WebhooksService,
        // Shared progress bus (made global by SetupModule). The Danger
        // Zone reset / reinstall actions emit progress events here so
        // the admin terminal can stream them in real time.
        private progress: SetupProgressService,
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
     * Accepts either the directory name or the slug from theme.json.
     * Returns null if not found in either location.
     *
     * Public so dependent modules (theme-editor) can resolve the active
     * theme's on-disk directory without duplicating the lookup.
     */
    public findThemePath(name: string): string | null {
        // 1. Exact directory name match
        const builtIn = path.join(this.builtInThemesPath, name);
        if (fs.existsSync(builtIn)) return builtIn;
        const uploaded = path.join(this.uploadPath, name);
        if (fs.existsSync(uploaded)) return uploaded;

        // 2. Search by theme.json slug (built-in)
        if (fs.existsSync(this.builtInThemesPath)) {
            for (const dir of fs.readdirSync(this.builtInThemesPath, { withFileTypes: true })) {
                if (!dir.isDirectory() || dir.name.startsWith('.')) continue;
                const configPath = path.join(this.builtInThemesPath, dir.name, 'theme.json');
                if (fs.existsSync(configPath)) {
                    try {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        if (config.slug === name) return path.join(this.builtInThemesPath, dir.name);
                    } catch { }
                }
            }
        }

        // 3. Search by theme.json slug (uploaded)
        if (fs.existsSync(this.uploadPath)) {
            for (const dir of fs.readdirSync(this.uploadPath, { withFileTypes: true })) {
                if (!dir.isDirectory() || dir.name.startsWith('.')) continue;
                const configPath = path.join(this.uploadPath, dir.name, 'theme.json');
                if (fs.existsSync(configPath)) {
                    try {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        if (config.slug === name) return path.join(this.uploadPath, dir.name);
                    } catch { }
                }
            }
        }

        return null;
    }

    /** Resolve the directory name for a theme (given slug or dir name). */
    private resolveThemeDirName(name: string): string {
        // If the directory itself exists, name is already the dir name
        if (fs.existsSync(path.join(this.builtInThemesPath, name))) return name;
        if (fs.existsSync(path.join(this.uploadPath, name))) return name;

        // Otherwise find by slug and return the actual directory name
        for (const baseDir of [this.builtInThemesPath, this.uploadPath]) {
            if (!fs.existsSync(baseDir)) continue;
            for (const dir of fs.readdirSync(baseDir, { withFileTypes: true })) {
                if (!dir.isDirectory() || dir.name.startsWith('.')) continue;
                const configPath = path.join(baseDir, dir.name, 'theme.json');
                if (fs.existsSync(configPath)) {
                    try {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        if (config.slug === name) return dir.name;
                    } catch { }
                }
            }
        }
        return name; // fallback to original
    }

    async processThemeUpload(file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
            throw new BadRequestException('Only zip files are allowed');
        }

        const themeName = path.parse(file.originalname).name;

        // Reject names with path traversal characters
        if (/[/\\<>:"|?*\x00]/.test(themeName) || themeName.startsWith('.')) {
            throw new BadRequestException('Invalid theme name in archive filename');
        }

        const extractPath = path.join(this.uploadPath, themeName);
        const extractPathNormalized = path.resolve(extractPath) + path.sep;

        const MAX_FILES = 2000;
        const MAX_UNZIPPED_BYTES = 100 * 1024 * 1024; // 100 MB

        try {
            const zip = new AdmZip(file.buffer);
            const entries = zip.getEntries();

            if (entries.length > MAX_FILES) {
                throw new BadRequestException(`Theme archive contains too many files (max ${MAX_FILES})`);
            }

            let totalUnzipped = 0;
            for (const entry of entries) {
                // ZIP Slip: verify each entry resolves inside the target directory
                const entryTarget = path.resolve(path.join(extractPath, entry.entryName));
                if (!entryTarget.startsWith(extractPathNormalized)) {
                    throw new BadRequestException(`Theme archive contains an unsafe path: ${entry.entryName}`);
                }

                // Size bomb: accumulate uncompressed sizes
                totalUnzipped += entry.header.size;
                if (totalUnzipped > MAX_UNZIPPED_BYTES) {
                    throw new BadRequestException('Theme archive is too large when unzipped (max 100 MB)');
                }
            }

            zip.extractAllTo(extractPath, true);
            return { message: 'Theme uploaded and extracted successfully', themeName, path: extractPath };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
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
        themeName = this.resolveThemeDirName(themeName);

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

            // Note: we no longer touch the theme's node_modules from here.
            // The dev-theme orchestrator (scripts/dev-theme.js) owns the
            // install lifecycle — it runs an integrity check + npm install
            // every time it starts a theme child process. Trying to manage
            // node_modules from the backend while the dev server holds the
            // .node binary memory-mapped causes EPERM on Windows and
            // leaves the install in a worse state than we found it.
            this.writeThemeEnv(themePath);

            // Decide whether the next activation should import seed content.
            //   - clearPrevious=true   → operator explicitly wants a reset → FRESH
            //   - first-time setup    → there's no existing data to preserve → FRESH
            //   - re-setup of a theme that's already been activated before → LEGACY
            //     (keep whatever content the client has edited since)
            //
            // The old behaviour hard-coded LEGACY when clearPrevious=false, which
            // meant uploading a brand-new theme → clicking Setup → clicking Activate
            // would land on an empty dashboard. That was the "content not loading
            // when activated" bug.
            const existingSetupType = await this.prisma.setting.findUnique({
                where: { key: `theme_setup_type_${themeName}` },
            });
            const setupType = (clearPrevious || !existingSetupType) ? 'FRESH' : 'LEGACY';
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

        // SVG previews are hand-crafted per-theme; prefer them over PNGs which may be stale screenshots
        const previewFile = themePath && (
            fs.existsSync(path.join(themePath, 'preview.svg')) ? 'preview.svg' :
            fs.existsSync(path.join(themePath, 'preview.png')) ? 'preview.png' :
            fs.existsSync(path.join(themePath, 'preview.jpg')) ? 'preview.jpg' : null
        );

        let previewUrl: string | null = null;
        if (previewFile && themePath) {
            previewUrl = `/themes-preview/${themeName}/${previewFile}`;
        }

        const setupTypeSetting = await this.prisma.setting.findUnique({
            where: { key: `theme_setup_type_${themeName}` }
        });

        return {
            name: config.name || themeName,
            slug: config.slug || themeName,
            dirName: themeName,
            version: config.version || '1.0.0',
            description: config.description || '',
            author: config.author || '',
            requiredModules: config.modules || config.requiredModules || [],
            websiteType: (config.websiteType as 'personal' | 'organizational' | null) || null,
            previewUrl,
            deployedUrl: config.deployedUrl || '',
            builtIn: !!(themePath && themePath.startsWith(this.builtInThemesPath)),
            setupType: setupTypeSetting?.value || null,
            // Package + plugin compat manifest — themes use these at render
            // time (via /public/capabilities) to decide whether to show a
            // section, a plugin-enhanced feature, or an upsell nudge.
            minPackageTier: config.minPackageTier ?? 1,
            supportedPackages: config.supportedPackages ?? ['any'],
            requiredCapabilities: config.requiredCapabilities ?? [],
            optionalCapabilities: config.optionalCapabilities ?? [],
            supportedPlugins: config.supportedPlugins ?? {},
            pluginIntegrations: config.pluginIntegrations ?? {},
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
            // This rebuilds the Prisma schema, runs db push, and the setupService will restart the process via main.ts touching
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
            // Unify: Delete existing posts with same slug to ensure fresh demo data
            await (this.prisma as any).post.deleteMany({ where: { slug: post.slug } });

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

    /**
     * Seed demo pages. When `variantSelections` is supplied (keyed by section
     * type/id), each matching section inside the page's data.sections array
     * gets a `_variant` override written into its data blob. Sections that
     * don't match a selection are left alone.
     */
    private async setupPages(
        pages: any[],
        variantSelections?: Record<string, string>,
    ): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const page of pages) {
            const pageToWrite = variantSelections
                ? this.applyVariantSelectionsToPage(page, variantSelections)
                : page;
            // Unify: Delete existing pages with same slug to ensure fresh demo data
            await (this.prisma as any).page.deleteMany({ where: { slug: page.slug } });

            await (this.prisma as any).page.create({
                data: {
                    ...pageToWrite,
                    theme: activeTheme,
                    status: (pageToWrite.status || 'PUBLISHED').toUpperCase(),
                },
            });
            count++;
        }
        return count;
    }

    /**
     * Returns a shallow clone of `page` with `_variant` applied to each section
     * whose id matches a key in `selections`. No mutation of the input object.
     */
    private applyVariantSelectionsToPage(page: any, selections: Record<string, string>): any {
        if (!page?.data?.sections || !Array.isArray(page.data.sections)) return page;
        const patchedSections = page.data.sections.map((section: any) => {
            const key = section?.id;
            const chosen = key && selections[key];
            if (!chosen) return section;
            return {
                ...section,
                data: {
                    ...(section.data ?? {}),
                    _variant: chosen,
                },
            };
        });
        return {
            ...page,
            data: { ...page.data, sections: patchedSections },
        };
    }

    private async setupMenus(menus: any[]): Promise<number> {
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const menuData of menus) {
            const { items, ...menu } = menuData;
            
            // If the menu exists, we delete it and its items to ensure a clean re-seed
            // since themes often expect specific structures for their main-nav/footer slugs.
            const existing = await (this.prisma as any).menu.findUnique({ where: { slug: menu.slug } });
            if (existing) {
                await (this.prisma as any).menuItem.deleteMany({ where: { menuId: existing.id } });
                await (this.prisma as any).menu.delete({ where: { id: existing.id } });
            }

            const createdMenu = await (this.prisma as any).menu.create({
                data: {
                    ...menu,
                    theme: activeTheme,
                },
            });

            if (items && items.length > 0) {
                // Recursive helper — creates an item and any nested `children`
                // (Nimble and Northwind ship two-level footer menus). Prisma can't
                // accept bare nested arrays, so we split: create the parent first
                // then re-enter with `parentId` set for each child.
                const createItem = async (item: any, parentId: string | null) => {
                    const { children, ...fields } = item ?? {};
                    const created = await (this.prisma as any).menuItem.create({
                        data: {
                            ...fields,
                            menuId: createdMenu.id,
                            parentId: parentId,
                        },
                    });
                    if (Array.isArray(children) && children.length > 0) {
                        for (const child of children) {
                            await createItem(child, created.id);
                        }
                    }
                };

                for (const item of items) {
                    await createItem(item, null);
                }
            }
            count++;
        }
        return count;
    }



    private async setupTeam(team: any[]): Promise<number> {
        const teamModel = (this.prisma as any).teamMember;
        if (!teamModel) return 0;
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const m of team) {
            const existing = await teamModel.findFirst({ where: { name: m.name } });
            if (existing) continue;
            await teamModel.create({
                data: {
                    name:        m.name,
                    role:        m.role,
                    bio:         m.bio         || null,
                    avatar:      m.avatar      || m.image || null,
                    order:       m.order       ?? 0,
                    socialLinks: m.socialLinks || {},
                },
            });
            count++;
        }
        return count;
    }

    private async setupTestimonials(testimonials: any[]): Promise<number> {
        const testimonialModel = (this.prisma as any).testimonial;
        if (!testimonialModel) return 0;
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const t of testimonials) {
            const existing = await testimonialModel.findFirst({
                where: { clientName: t.clientName || t.name },
            });
            if (existing) continue;
            // Map theme.json fields → Prisma column names; strip unknown keys.
            //
            // The Prisma `Testimonial` model uses `clientName / clientRole /
            // clientCompany / content / rating / clientAvatar`. Theme seeds
            // (and previous seed conventions) variously use:
            //   - name / role / company / quote / avatarUrl
            //   - or the canonical client* names directly.
            // We accept both shapes here so authors don't have to memorize
            // the DB schema. `content` is required at the DB level — fall
            // through quote / text / message before giving up.
            const content =
                t.content ?? t.quote ?? t.text ?? t.message ?? '';
            await testimonialModel.create({
                data: {
                    clientName:    t.clientName    || t.name,
                    clientRole:    t.clientRole    || t.role    || null,
                    clientCompany: t.clientCompany || t.company || null,
                    content,
                    rating:        t.rating        ?? 5,
                    clientAvatar:  t.clientAvatar  || t.clientPhoto || t.avatarUrl || t.photo || null,
                },
            });
            count++;
        }
        return count;
    }

    private async setupServices(services: any[]): Promise<number> {
        const serviceModel = (this.prisma as any).service;
        if (!serviceModel) return 0;
        let count = 0;
        const activeTheme = await this.getActiveTheme();
        for (const s of services) {
            // Accept both `title` (Prisma column) and `name` (alternate
            // convention used by some theme seeds). Strip unknown keys.
            const title = s.title || s.name || '';
            if (!title) continue;
            const existing = await serviceModel.findFirst({ where: { title } });
            if (existing) continue;
            await serviceModel.create({
                data: {
                    title,
                    description: s.description || null,
                    icon:        s.icon        || null,
                    image:       s.image       || null,
                    order:       s.order       ?? 0,
                },
            });
            count++;
        }
        return count;
    }


    async setActiveTheme(
        themeName: string,
        importDemoContent?: boolean,
        purgePrevious: boolean = false,
        designKey?: string,
    ) {
        // Default to seeding when the caller didn't say either way.
        // Rationale: the previous default was `false`, which meant a
        // first-time activation through the wizard or admin (without
        // an explicit checkbox) ended up with an active theme but
        // every Page / Menu / Testimonial table empty. Customers
        // saw a working settings page but a blank Site Pages screen.
        //
        // The downstream seed pipeline ALREADY guards against
        // re-seeding existing data — it only runs when
        // `theme_setup_type_<name>` is missing or === 'FRESH'. So
        // defaulting to true here is safe: a re-activation of a
        // previously-set-up theme is a no-op for content.
        if (importDemoContent === undefined) {
            importDemoContent = true;
        }
        // A theme "design" is a named preset that bundles a sectionVariants
        // map across every page. The activation modal lets the user pick one;
        // we resolve it here and reuse the existing applyVariantSelectionsToPage
        // machinery to inject `_variant` into seeded sections.
        const variantSelections = await this.resolveDesignToVariantSelections(
            themeName,
            designKey,
        );
        // Persist the chosen design so Customize UI can show "current design"
        // and subsequent design swaps have a reference point. Harmless for
        // themes that don't declare designs.
        if (designKey) {
            await this.prisma.setting.upsert({
                where: { key: `theme_design_${themeName}` },
                create: { key: `theme_design_${themeName}`, value: designKey },
                update: { value: designKey },
            });
        }
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        // Always store the directory name so dev-theme.js can locate the folder
        const dirName = this.resolveThemeDirName(themeName);
        themeName = dirName;

        // ── Package enforcement: minTier ────────────────────────────────────
        // Each theme declares a minTier in its theme.json. If the active
        // license tier is lower, block activation so that clients on cheaper
        // packages cannot use premium themes.
        const configPath = path.join(themePath, 'theme.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
                // Accept both new spelling (minPackageTier — spec'd in
                // docs/THEME_MANIFEST_SPEC.md) and legacy minTier.
                const minTier = config.minPackageTier ?? config.minTier ?? 0;
                // Resolve tier from the customer's active package, not
                // from the legacy `process.env.TIER` env-var fallback.
                // The env var defaulted to 'premium' (tier 2), so even
                // after activating a Custom-tier license via Settings →
                // License (which writes `active_package_id`), the gate
                // still saw tier 2 and refused mero-pro activation.
                // currentTier() reads the resolved package tier and
                // honours custom / professional / enterprise correctly.
                const ct = await this.currentTier();
                const activeTier = ct.tier;
                if (activeTier < minTier) {
                    throw new ForbiddenException(
                        `Theme "${themeName}" requires tier ${minTier} but your license is tier ${activeTier}. ` +
                        `Please upgrade your package to use this theme.`,
                    );
                }

                // Enforce explicit supportedPackages whitelist when declared.
                // Backwards-compat: ['any'] (or absent) means no restriction.
                const supported: string[] = Array.isArray(config.supportedPackages)
                    ? config.supportedPackages
                    : ['any'];
                if (!supported.includes('any')) {
                    const activePkg = await this.prisma.setting.findUnique({ where: { key: 'active_package_id' } });
                    const activePkgId = (activePkg as any)?.value as string | undefined;
                    if (activePkgId && !supported.includes(activePkgId)) {
                        throw new ForbiddenException(
                            `Theme "${themeName}" is not supported on your plan (${activePkgId}). ` +
                            `Supported packages: ${supported.join(', ')}.`,
                        );
                    }
                }
            } catch (e) {
                if (e instanceof ForbiddenException) throw e;
                // If theme.json is malformed, log but don't block activation
                console.warn(`[Themes] Could not read minTier from theme.json for ${themeName}:`, (e as Error).message);
            }
        }

        // ── Package enforcement: starterThemes whitelist ────────────────────
        // Basic/Premium plans ship with a fixed list of allowed themes. Plans
        // with starterThemes === ['any'] (Professional / Enterprise / Custom)
        // may activate any theme on disk, including uploaded ones.
        try {
            const activePkgRow = await this.prisma.setting.findUnique({
                where: { key: 'active_package_id' },
            });
            const packageId = (activePkgRow as any)?.value as string | undefined;
            const pkg = packageId ? PACKAGES.find((p) => p.id === packageId) : undefined;
            const allowed = pkg?.starterThemes ?? [];
            if (allowed.length > 0 && !allowed.includes('any') && !allowed.includes(themeName)) {
                throw new ForbiddenException(
                    `Theme "${themeName}" is not included in your current plan (${pkg?.name ?? 'unknown'}). ` +
                    `Allowed themes: ${allowed.join(', ')}. Upgrade to Professional or Enterprise to activate any theme.`,
                );
            }
        } catch (e) {
            if (e instanceof ForbiddenException) throw e;
            // If the package lookup fails, log but don't block activation — fail-safe
            console.warn(`[Themes] Could not verify starterThemes whitelist:`, (e as Error).message);
        }

        // Ensure the theme's .env.local has the right CMS_API_URL before we
        // activate it — covers themes that were set up on older backend versions
        // and themes activated without going through setupTheme first.
        this.writeThemeEnv(themePath);

        // We do NOT touch the theme's node_modules or .next cache here.
        // That's the dev-theme orchestrator's job (scripts/dev-theme.js).
        // Reasoning:
        //
        //   • The orchestrator runs `prepareTheme()` every time it starts
        //     a theme child process — integrity check, npm install when
        //     missing/corrupt, .next wipe before boot. It does this AFTER
        //     killing the old child, so the file locks that block us
        //     from the backend side don't apply to it.
        //
        //   • Trying to wipe + reinstall from here while the theme dev
        //     server is running on :3002 fails with EPERM on Windows
        //     (next-swc.win32-x64-msvc.node is memory-mapped). The
        //     wipe leaves node_modules half-deleted and the theme
        //     500s on every request until manual recovery.
        //
        // Activation just persists `active_theme`. The orchestrator polls
        // that setting every 4s — when it changes, it stops the current
        // child, runs prepareTheme, and starts the new theme. Clean.

        const results: Record<string, number> = {};

        // Set active_theme FIRST so all seed helpers pick up the correct theme
        const previousTheme = await this.getActiveTheme();

        if (purgePrevious && previousTheme && previousTheme !== themeName) {
            console.log(`[Themes] Purging data for previous theme: ${previousTheme}`);
            await this.purgeDatabase(previousTheme);
        }

        await this.prisma.setting.upsert({
            where: { key: 'active_theme' },
            create: { key: 'active_theme', value: themeName },
            update: { value: themeName },
        });

        // Bump the theme-restart counter so the dev-theme orchestrator
        // notices and recycles the theme dev server, even when the theme
        // NAME hasn't changed (re-activation of the same theme to
        // re-seed). The orchestrator polls this value alongside
        // active_theme; a change to either triggers a restart.
        const counterRow = await this.prisma.setting.findUnique({
            where: { key: 'theme_restart_counter' },
        });
        const nextCounter = (Number(counterRow?.value) || 0) + 1;
        await this.prisma.setting.upsert({
            where: { key: 'theme_restart_counter' },
            create: { key: 'theme_restart_counter', value: String(nextCounter) },
            update: { value: String(nextCounter) },
        });

        // Auto-enable every module the theme declares as required.
        //
        // Why this is here: `isModuleEnabled()` filters seedData to
        // only run for modules the customer ticked at install time.
        // If they didn't tick `pages` / `menus` / `team` / etc.,
        // those tables are not seeded — the customer activates the
        // theme and finds blogs populated but every other module
        // empty. (User-reported bug.)
        //
        // The right behaviour: when a theme says it needs `pages`,
        // activation auto-enables `pages` AND its sibling modules.
        // The schema rebuild + db push happens inside
        // updateEnabledModules. Also patches `process.env.ENABLED_MODULES`
        // in-process so isModuleEnabled() picks up the new list
        // without a restart. Restart still happens for new tables to
        // appear in the running Prisma client, but the seed below
        // runs before then so the user sees data even on a hot run.
        try {
            const themeConfigPath = path.join(themePath, 'theme.json');
            if (fs.existsSync(themeConfigPath)) {
                const themeConfig = JSON.parse(
                    fs.readFileSync(themeConfigPath, 'utf8').replace(/^﻿/, ''),
                );
                const requiredModules: string[] =
                    themeConfig.modules || themeConfig.requiredModules || [];
                if (requiredModules.length > 0) {
                    const currentlyEnabled = await this.setupService.getEnabledModules();
                    const missing = requiredModules.filter(rm => !currentlyEnabled.includes(rm));
                    if (missing.length > 0) {
                        const allModules = Array.from(new Set([...currentlyEnabled, ...missing]));
                        await this.setupService.updateEnabledModules(allModules);
                        // Sync the in-process env var so isModuleEnabled()
                        // sees the new list immediately.
                        process.env.ENABLED_MODULES = allModules.join(',');
                        console.log(
                            `[Themes] Auto-enabled ${missing.length} module(s) required by "${themeName}":`,
                            missing.join(', '),
                        );
                    }
                }
            }
        } catch (err: any) {
            console.warn(
                `[Themes] Could not auto-enable theme modules: ${err?.message}. Seed may skip some modules.`,
            );
        }

        if (importDemoContent) {
            const setupType = await this.prisma.setting.findUnique({
                where: { key: `theme_setup_type_${themeName}` }
            });
            
            // Seed if it's explicitly FRESH or if no setup type exists (first time activation)
            if (!setupType || setupType.value === 'FRESH') {
                const configPath = path.join(themePath, 'theme.json');
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
                const seed = config.seedData || config.seed || {};

                // Seed blog categories BEFORE posts so category FK resolves
                if (this.isModuleEnabled('blogs') && seed.blogCategories?.length) results.blogCategories = await this.setupBlogCategories(seed.blogCategories);
                if (this.isModuleEnabled('blogs') && seed.posts?.length) results.posts = await this.setupPosts(seed.posts);
                if (this.isModuleEnabled('pages') && seed.pages?.length) results.pages = await this.setupPages(seed.pages, variantSelections);
                if (this.isModuleEnabled('menus') && seed.menus?.length) results.menus = await this.setupMenus(seed.menus);
                if (this.isModuleEnabled('team') && seed.team?.length) results.team = await this.setupTeam(seed.team);
                if (this.isModuleEnabled('testimonials') && seed.testimonials?.length) results.testimonials = await this.setupTestimonials(seed.testimonials);
                if (this.isModuleEnabled('services') && seed.services?.length) results.services = await this.setupServices(seed.services);
                if (this.isModuleEnabled('collections') && config.requiredCollections?.length) {
                    results.collections = await this.setupRequiredCollections(config.requiredCollections, seed.collectionItems || {});
                }

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

        this.webhooksService.dispatch('theme.activated', { theme: themeName }).catch(() => { });
        return { message: `Theme "${themeName}" activated`, results };
    }

    /**
     * Integrity canary — same logic as scripts/dev-theme.js. If the file is
     * missing we treat node_modules as corrupt and reinstall. Matches the
     * "page-path/ensure-leading-slash" symptom that shows up when an install
     * is torn down partway through (common on Windows, or when the dev
     * server held files during a previous install).
     */
    private static readonly NEXT_INTEGRITY_CANARY = path.join(
        'next', 'dist', 'shared', 'lib', 'router', 'utils', 'page-path', 'ensure-leading-slash.js',
    );

    private isThemeInstallHealthy(themePath: string): boolean {
        const nm = path.join(themePath, 'node_modules');
        if (!fs.existsSync(nm)) return false;
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(themePath, 'package.json'), 'utf8'));
            const hasNext = !!(pkg.dependencies?.next || pkg.devDependencies?.next);
            if (!hasNext) return true;
        } catch {
            return true;
        }
        return fs.existsSync(path.join(nm, ThemesService.NEXT_INTEGRITY_CANARY));
    }

    /**
     * Clear the theme's .next cache. Safe to call every activation — Turbopack
     * will rebuild on next dev request, and this prevents "module not found"
     * errors caused by stale manifests pointing at files that don't exist
     * after a reinstall.
     */
    private clearThemeBuildCache(themePath: string): void {
        const nextCache = path.join(themePath, '.next');
        if (!fs.existsSync(nextCache)) return;
        try {
            fs.rmSync(nextCache, { recursive: true, force: true });
            console.log(`[Themes] Cleared .next cache for ${themePath}`);
        } catch (e) {
            console.warn(`[Themes] Could not clear .next cache for ${themePath}: ${(e as Error).message}`);
        }
    }

    /**
     * Install theme npm dependencies (background) and repair corrupt installs.
     * Does not block the HTTP request — the CMS backend doesn't need the theme's
     * node_modules to function. They're only needed when the theme frontend runs.
     *
     * Sequence:
     *   1. If node_modules is missing → install.
     *   2. If node_modules exists but the Next.js integrity canary is missing
     *      → the install is corrupt. Wipe and reinstall.
     *   3. Always clear .next so Turbopack rebuilds cleanly on next boot.
     */
    private installDependencies(themePath: string): void {
        const nmPath = path.join(themePath, 'node_modules');
        const nmExists = fs.existsSync(nmPath);
        const healthy = this.isThemeInstallHealthy(themePath);

        this.clearThemeBuildCache(themePath);

        if (nmExists && healthy) return;

        // On Windows, the running theme dev server holds
        // node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node
        // memory-mapped — `fs.rmSync` will fail with EPERM and leave the
        // tree partially deleted. Previously we bailed there and the
        // theme stayed broken until the customer manually reinstalled.
        //
        // The fix: try the wipe but DON'T bail on failure. `npm install`
        // is idempotent and can repair a partial / missing tree without
        // needing a clean slate. So even if the wipe fails (locked
        // files), we still attempt the install — it'll skip what's
        // already there and fill in what's missing, including the
        // commonly-corrupted @swc/helpers package.
        if (nmExists && !healthy) {
            console.warn(`[Themes] Corrupt node_modules in ${themePath} — attempting repair.`);
            try {
                fs.rmSync(nmPath, { recursive: true, force: true });
                const lock = path.join(themePath, 'package-lock.json');
                if (fs.existsSync(lock)) fs.rmSync(lock, { force: true });
                console.log(`[Themes] Wiped corrupt install — running fresh npm install.`);
            } catch (e) {
                console.warn(
                    `[Themes] Could not wipe corrupt install (Windows file lock?): ${(e as Error).message}. ` +
                    `Will attempt npm install on the partial tree — it usually repairs missing deps.`,
                );
                // Fall through to npm install rather than returning.
            }
        }

        execAsync('npm install --prefer-offline --no-audit --no-fund', { cwd: themePath })
            .then(() => {
                console.log(`[Themes] Dependencies installed for ${themePath}`);
                // Re-verify health post-install. If still broken, the
                // theme dev server is holding files that npm couldn't
                // overwrite — operator must stop the dev server and
                // retry. We log loudly so it's visible.
                if (!this.isThemeInstallHealthy(themePath)) {
                    console.error(
                        `[Themes] node_modules at ${themePath} is still corrupt after npm install. ` +
                        `Stop the theme dev server (port 3002), then re-run activation. ` +
                        `On Windows the dev process holds files that npm cannot overwrite.`,
                    );
                }
            })
            .catch(e => console.error(`[Themes] npm install failed (non-fatal): ${e.message}`));
    }

    /**
     * Write CMS_API_URL into the theme's .env.local so its Next.js process
     * knows where to fetch content from. Preserves any pre-existing keys the
     * theme author set; only updates/adds CMS_API_URL and NEXT_PUBLIC_CMS_API_URL.
     *
     * Source of truth for the URL:
     *   1. BACKEND_PUBLIC_URL env var (set in prod to the Railway / custom domain)
     *   2. Fallback: http://localhost:${PORT ?? 3001} (dev)
     *
     * Non-fatal: if the write fails (readonly fs, etc.) we log and continue —
     * the theme can still boot using an existing .env.local or operator-set env.
     */
    private writeThemeEnv(themePath: string): void {
        try {
            const backendUrl =
                process.env.BACKEND_PUBLIC_URL ||
                `http://localhost:${process.env.PORT || 3001}`;

            const envPath = path.join(themePath, '.env.local');
            const toSet: Record<string, string> = {
                CMS_API_URL: backendUrl,
                NEXT_PUBLIC_CMS_API_URL: backendUrl,
            };

            let lines: string[] = [];
            if (fs.existsSync(envPath)) {
                lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
            }

            const seen = new Set<string>();
            lines = lines.map(line => {
                const m = line.match(/^([A-Z_][A-Z0-9_]*)=/);
                if (m && toSet[m[1]] !== undefined) {
                    seen.add(m[1]);
                    return `${m[1]}=${toSet[m[1]]}`;
                }
                return line;
            });

            for (const [k, v] of Object.entries(toSet)) {
                if (!seen.has(k)) lines.push(`${k}=${v}`);
            }

            // Trim trailing blanks, ensure a single trailing newline
            while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
            fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
            console.log(`[Themes] Wrote CMS_API_URL=${backendUrl} to ${envPath}`);
        } catch (e) {
            console.error(
                `[Themes] Failed to write theme .env.local (non-fatal): ${(e as Error).message}`,
            );
        }
    }

    private async purgeDatabase(themeName?: string | null) {
        try {
            console.log(`[Themes] Purging database for theme: ${themeName || 'ALL'}`);
            const filter = themeName ? { theme: themeName } : {};

            // 1. Pages
            if (this.isModuleEnabled('pages')) {
                const result = await (this.prisma as any).page.deleteMany({ where: filter });
                console.log(`[Themes] Purged ${result.count} pages`);
            }
            
            // 2. Menus (special handling for cascade)
            if (this.isModuleEnabled('menus')) {
                const menusToDelete = await (this.prisma as any).menu.findMany({ where: filter });
                const menuIds = menusToDelete.map((m: any) => m.id);
                if (menuIds.length > 0) {
                    await (this.prisma as any).menuItem.deleteMany({ where: { menuId: { in: menuIds } } });
                    const result = await (this.prisma as any).menu.deleteMany({ where: filter });
                    console.log(`[Themes] Purged ${result.count} menus`);
                }
            }
            
            // 3. Dynamic Modules — no theme column, wipe all rows (they are theme-seeded)
            const dynamicModules: Array<{ model: string; module: string }> = [
                { model: 'teamMember', module: 'team' },
                { model: 'testimonial', module: 'testimonials' },
                { model: 'service', module: 'services' },
            ];
            for (const { model: modelKey, module: moduleKey } of dynamicModules) {
                if (!this.isModuleEnabled(moduleKey)) continue;
                try {
                    const model = (this.prisma as any)[modelKey];
                    if (model) {
                        const result = await model.deleteMany({});
                        console.log(`[Themes] Purged ${result.count} records from ${modelKey}`);
                    }
                } catch (e) {
                    console.warn(`[Themes] Failed to purge module ${modelKey}:`, e.message);
                }
            }

            // 4. Collections — no theme column, wipe all
            try {
                if (this.isModuleEnabled('collections')) {
                    await (this.prisma as any).collectionItem.deleteMany({});
                    const result = await (this.prisma as any).collection.deleteMany({});
                    console.log(`[Themes] Purged ${result.count} collections`);
                }
            } catch (e) {
                console.warn(`[Themes] Failed to purge collections:`, e.message);
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
     * - Wipes ALL content (pages, menus, team, testimonials, services, posts, leads, media records)
     * - Removes theme-related settings (active_theme, all theme_setup_type_* and theme_url_* keys,
     *   and site-level settings that themes customise like primary_color, site_title etc.)
     * - Keeps: users, roles, system settings (enabled_modules, setup_complete, cms_*)
     */
    async resetToBaseState(options: { hardReset?: boolean } = {}): Promise<{ cleared: Record<string, number> }> {
        const cleared: Record<string, number> = {};
        const op = options.hardReset ? 'factory-reset' : 'content-reset';

        this.progress.started(op, options.hardReset
            ? 'Starting factory reset — wiping content, settings, and re-running setup…'
            : 'Starting content reset — keeping users and system config…');

        // 1. Clear all content tables
        const contentModels = [
            'menuItem', 'menu',
            'page',
            'teamMember',
            'testimonial',
            'service',
            'lead',
            'notification',
            'seoMeta',
            'media',
            'activityLog',
            'comment',
            'post',
            'tag',
            'category',
        ];

        this.progress.started('reset-content', `Clearing ${contentModels.length} content tables…`);
        for (const modelName of contentModels) {
            try {
                const model = (this.prisma as any)[modelName];
                if (model) {
                    const result = await model.deleteMany({});
                    cleared[modelName] = result.count;
                    if (result.count > 0) {
                        this.progress.progress('reset-content', `  ${modelName}: ${result.count} rows removed`);
                    }
                }
            } catch (e) {}
        }
        this.progress.completed('reset-content', 'Content tables cleared.');

        // 2. Clear all theme/site settings
        this.progress.started('reset-settings', 'Clearing theme & site settings…');
        let keepKeys = ['enabled_modules', 'setup_complete', 'cms_title', 'cms_subtitle', 'cms_login_avatar'];

        if (options.hardReset) {
            console.log('[Themes] Performing HARD RESET - Clearing all settings and setup status');
            keepKeys = []; // Wipe everything

            // Also reset environment variables if possible (though settings are primary)
            const backendRoot = path.join(process.cwd());
            const envPath = path.join(backendRoot, '.env');
            if (fs.existsSync(envPath)) {
                let envContent = fs.readFileSync(envPath, 'utf8');
                envContent = envContent.replace(/^SETUP_COMPLETE=.*$/m, 'SETUP_COMPLETE="false"');
                envContent = envContent.replace(/^ENABLED_MODULES=.*$/m, 'ENABLED_MODULES=""');
                fs.writeFileSync(envPath, envContent, 'utf8');
                this.progress.progress('reset-settings', '  .env: SETUP_COMPLETE rolled back to false');
            }
        }

        const removed = await (this.prisma as any).setting.deleteMany({
            where: { key: { notIn: keepKeys } },
        });
        cleared['settings_removed'] = removed.count;
        this.progress.completed('reset-settings', `${removed.count} settings rows removed.`);

        if (options.hardReset) {
            this.progress.completed(op, 'Factory reset complete. Restarting server — the wizard will reopen on reload.');
            console.log('[Themes] Reset complete. Restarting server...');
            setTimeout(() => {
                if (process.env.NODE_ENV !== 'production') {
                    const mainPath = path.join(process.cwd(), 'src', 'main.ts');
                    if (fs.existsSync(mainPath)) {
                        const time = new Date();
                        fs.utimesSync(mainPath, time, time);
                    } else {
                        process.exit(0);
                    }
                } else {
                    process.exit(0);
                }
            }, 1500);
        } else {
            this.progress.completed(op, 'Content reset complete. Re-pick a theme to seed fresh demo content.');
        }

        return { cleared };
    }

    /**
     * Reinstall the active theme — re-runs setup with FRESH seed.
     *
     * The "Reinstall" Danger Zone action and the per-theme card's
     * Reinstall button both route here. We deliberately don't expose
     * the underlying setActiveTheme(name, clearPrevious=true) directly
     * to the UI because:
     *
     *   1. Discoverability — there's one canonical entry point named
     *      after what it does ("reinstall"), not "activate with this
     *      magic flag set".
     *   2. Streaming — wrapping in our own method lets us emit progress
     *      events at the right boundaries (started → activate → done)
     *      without polluting the regular activate path that's called
     *      from many places (theme gallery, picker, design switcher).
     *   3. Safety — we explicitly mark setup_type as FRESH BEFORE
     *      calling setActiveTheme so seed re-import is guaranteed.
     *      The activate path's own setupType heuristic (FRESH on first
     *      install, LEGACY on subsequent activates) would otherwise
     *      keep the customer's edited content.
     */
    async reinstallActiveTheme(): Promise<{ themeName: string; cleared: Record<string, number> }> {
        const themeName = await this.getActiveTheme();
        if (!themeName) {
            this.progress.failed('reinstall', 'No active theme to reinstall.');
            throw new BadRequestException('No active theme — pick one from the gallery first.');
        }

        this.progress.started('reinstall', `Reinstalling "${themeName}"…`);
        try {
            // Force the next setActiveTheme to import seed data.
            this.progress.started('reinstall-mark-fresh', 'Marking theme as FRESH so seed content re-imports…');
            await this.prisma.setting.upsert({
                where: { key: `theme_setup_type_${themeName}` },
                update: { value: 'FRESH' },
                create: { key: `theme_setup_type_${themeName}`, value: 'FRESH' },
            });
            this.progress.completed('reinstall-mark-fresh', 'Marked.');

            // Run activation under the same name. clearPrevious=true so
            // the FRESH seed flow runs, content is rewritten from
            // theme.json's seedData, and any media is re-imported.
            this.progress.started('reinstall-activate', 'Re-activating theme — seed content + media import…');
            await this.setActiveTheme(themeName, true);
            this.progress.completed('reinstall-activate', 'Theme re-activated.');

            this.progress.completed('reinstall', `"${themeName}" reinstalled. Refresh the dashboard to see seed content.`);
            return { themeName, cleared: { reinstalled: 1 } };
        } catch (err: any) {
            this.progress.failed('reinstall', `Reinstall failed: ${err?.message}`, err?.stack);
            throw err;
        }
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
            return await this.mergeActiveDesign(rest);
        } catch { return null; }
    }

    /**
     * Phase 7 (#117) — bundle dispatcher. If the manifest declares a
     * `bundle.designs[]`, overlay the currently-active design's
     * `pages` / `widgetCatalog` / `componentRoot` on top of the bundle-
     * level config so existing callers (page-schema endpoint, widget-
     * catalog endpoint, gallery) keep working without per-call changes.
     *
     * Active design resolution:
     *   1. setting `active_theme_design` (written by the admin design picker)
     *   2. theme.json `bundle.activeDesign`
     *   3. `bundle.designs[0].key`
     *
     * For non-bundle themes the input is returned untouched, so the
     * legacy flat-theme path is unaffected.
     */
    private async mergeActiveDesign(rest: any): Promise<any> {
        const bundle = rest?.bundle;
        if (!bundle || !Array.isArray(bundle.designs) || bundle.designs.length === 0) {
            return rest;
        }
        let settingValue: string | null = null;
        try {
            const row = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme_design' } });
            settingValue = (row?.value && typeof row.value === 'string') ? row.value : null;
        } catch { /* setting table may not exist on first boot */ }
        const activeKey = settingValue || bundle.activeDesign || bundle.designs[0]?.key;
        const active = bundle.designs.find((d: any) => d?.key === activeKey) || bundle.designs[0];
        if (!active) return rest;

        return {
            ...rest,
            activeDesign: active.key,
            pageSchema: Array.isArray(active.pages) && active.pages.length
                ? active.pages
                : rest.pageSchema,
            widgetCatalog: Array.isArray(active.widgetCatalog) && active.widgetCatalog.length
                ? active.widgetCatalog
                : rest.widgetCatalog,
            widgetCategories: Array.isArray(active.widgetCategories) && active.widgetCategories.length
                ? active.widgetCategories
                : rest.widgetCategories,
            componentRoot: active.componentRoot || rest.componentRoot,
            bundle: { ...bundle, activeDesign: active.key },
        };
    }

    /**
     * Read the active theme's widgetCatalog — the registry of available
     * widget types that drives the visual editor's palette. Each entry
     * has type / name / description / icon / category / premium and
     * inlines its fields from moduleSchemas. Returns an empty catalog
     * if the theme is legacy (no widgetCatalog in theme.json).
     *
     * Note: this is the *raw* catalog. The controller layers tier-aware
     * `locked` flags on top before responding to the client.
     */
    async getWidgetCatalog(): Promise<{ widgets: any[]; categories: any[] }> {
        const config = await this.getActiveThemeConfig();
        const themeWidgets: any[] = Array.isArray((config as any)?.widgetCatalog)
            ? (config as any).widgetCatalog
            : [];
        const themeCategories: any[] = Array.isArray((config as any)?.widgetCategories)
            ? (config as any).widgetCategories
            : [];

        // ── Plugin-contributed widgets ────────────────────────────────
        // Phase 6.1 — installed AND enabled plugins can declare
        // additional widgets in their manifest. Merge them here so the
        // visual editor's palette sees plugin widgets alongside theme
        // widgets without a special-case fetch path. Each plugin widget
        // is stamped with `pluginSlug` so #89's renderer can route the
        // type to the right component bundle later.
        //
        // We intentionally read the setting directly rather than going
        // through PluginsService — pulling that in would create a
        // circular module dependency (plugins.service already depends
        // on this service for the gate checks).
        const pluginWidgets: any[]    = [];
        const pluginCategories: any[] = [];
        try {
            const setting = await this.prisma.setting.findUnique({
                where: { key: 'installed_plugins' },
            });
            const installed: Array<{ slug: string; enabled: boolean }> =
                setting?.value && typeof setting.value === 'string'
                    ? JSON.parse(setting.value)
                    : (Array.isArray((setting as any)?.value) ? (setting as any).value : []);
            // Lazy require to keep the plugins module self-contained —
            // ThemesService doesn't otherwise depend on the catalog file.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { PLUGIN_CATALOG } = require('../plugins/catalog');
            const seenWidgetTypes  = new Set<string>(themeWidgets.map((w) => w.type));
            const seenCategoryKeys = new Set<string>(themeCategories.map((c: any) => c?.key));
            for (const inst of installed) {
                if (!inst.enabled) continue;
                const manifest = PLUGIN_CATALOG.find((m: any) => m.slug === inst.slug);
                if (!manifest) continue;
                for (const w of (manifest.widgets || [])) {
                    if (!w?.type || seenWidgetTypes.has(w.type)) continue;
                    seenWidgetTypes.add(w.type);
                    pluginWidgets.push({ ...w, pluginSlug: manifest.slug });
                }
                for (const c of (manifest.widgetCategories || [])) {
                    if (!c?.key || seenCategoryKeys.has(c.key)) continue;
                    seenCategoryKeys.add(c.key);
                    pluginCategories.push({ ...c, pluginSlug: manifest.slug });
                }
            }
        } catch (e) {
            // Swallow — plugin catalog issues shouldn't break the editor.
            // Theme widgets still render fine from the theme.json side.
            // eslint-disable-next-line no-console
            console.warn('[themes.getWidgetCatalog] plugin merge failed:', (e as Error).message);
        }

        // Defensive normalization — make sure every widget has an icon, a
        // category, and a fields[] array. Saves the editor from null checks.
        const normalized = [...themeWidgets, ...pluginWidgets].map((w: any) => ({
            type: w.type,
            name: w.name || w.type,
            description: w.description || '',
            icon: w.icon || 'Square',
            category: w.category || 'content',
            premium: !!w.premium,
            fields: Array.isArray(w.fields) ? w.fields : [],
            // Stamp plugin-contributed widgets so the editor can show
            // a "from <plugin>" label and #89's runtime can resolve
            // the right component bundle. Theme-native widgets get
            // pluginSlug: null.
            pluginSlug: w.pluginSlug || null,
        }));
        return {
            widgets: normalized,
            categories: [...themeCategories, ...pluginCategories],
        };
    }

    /**
     * Return the active theme's page schema (for the section editor).
     *
     * A section may declare optional `variants` in theme.json — an array of
     * `{ key, label, description? }` objects. When present, the Visual Theme
     * Editor shows a variant picker; the chosen variant is saved as
     * `sections[].data._variant` and consumed by the theme's renderer.
     */
    async getPageSchema(): Promise<any[]> {
        const config = await this.getActiveThemeConfig();
        const pages: any[] = config?.pageSchema || [];
        // theme.json keeps section field definitions in `moduleSchemas[type]`
        // so they can be reused across pages. The admin's site-pages editor
        // iterates `sec.fields` directly though, so we inline the right
        // module schema's fields onto each section before returning. This
        // keeps the front-end blissfully unaware of the indirection.
        const moduleSchemas: Record<string, any[]> = (config as any)?.moduleSchemas || {};
        return pages.map((page: any) => ({
            ...page,
            label: page.label || page.name || page.slug,
            sections: (page.sections || []).map((sec: any) => {
                const type = sec.type || sec.id;
                // `sec.fields` may already be set inline (legacy themes) —
                // honour that, otherwise look up by section type. Always
                // produce an array so consumers can `for (const f of …)`
                // without a guard.
                const fields = Array.isArray(sec.fields)
                    ? sec.fields
                    : (Array.isArray(moduleSchemas[type]) ? moduleSchemas[type] : []);
                return {
                    ...sec,
                    id: sec.id || sec.type,
                    type,
                    fields,
                    variants: Array.isArray(sec.variants)
                        ? sec.variants.map((v: any) => ({
                            key: v.key,
                            label: v.label || v.key,
                            description: v.description,
                        }))
                        : [],
                };
            }),
        }));
    }

    /**
     * Return the theme's top-level "designs" — named page-level presets that
     * bundle a sectionVariants map across every page. The admin activation
     * modal surfaces these as a "pick a design" step so the whole site
     * shifts coherently when the user chooses one.
     *
     * Returns [] if the theme doesn't declare any designs, in which case
     * callers should treat the theme as a single-design theme.
     */
    async getThemeDesigns(themeName: string): Promise<any[]> {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);
        const configPath = path.join(themePath, 'theme.json');
        if (!fs.existsSync(configPath)) return [];
        let config: any;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
        } catch {
            return [];
        }
        // Bundle shape (Phase 7) — surface every design with its
        // `bundleAccess`, preview path, and a `locked` flag computed
        // against the customer's current tier. The admin design picker
        // renders the locked ones with an upgrade CTA instead of an
        // activate button.
        if (config.bundle && Array.isArray(config.bundle.designs) && config.bundle.designs.length) {
            // Same fix as setActiveDesign — gate by tier number so
            // bundleAccess: ['professional'] and ['enterprise'] both
            // resolve to "tier 3 customers can use this", admitting
            // both personal-professional and org-enterprise.
            const ct = await this.currentTier();
            let activeDesignKey: string | null = null;
            try {
                const row = await (this.prisma as any).setting.findUnique({ where: { key: 'active_theme_design' } });
                activeDesignKey = (row?.value && typeof row.value === 'string') ? row.value : null;
            } catch { /* setting table may not exist on first boot */ }
            const fallbackKey = config.bundle.activeDesign || config.bundle.designs[0]?.key;
            const currentKey = activeDesignKey || fallbackKey;
            return config.bundle.designs.map((d: any) => {
                const bundleAccess: string[] = Array.isArray(d.bundleAccess) ? d.bundleAccess : [];
                const locked = !this.tierAllowsBundle(bundleAccess, ct.tier);
                return {
                    key: d.key,
                    label: d.name || d.label || d.key,
                    description: d.description || '',
                    preview: d.preview || '',
                    bundleAccess,
                    locked,
                    isActive: d.key === currentKey,
                    isDefault: d.key === fallbackKey,
                    sectionVariants: {},
                };
            });
        }

        const designs = Array.isArray(config.designs) ? config.designs : [];
        const defaultKey = config.defaultDesignKey || designs[0]?.key;
        return designs.map((d: any) => ({
            key: d.key,
            label: d.label || d.key,
            description: d.description || '',
            isDefault: d.key === defaultKey,
            sectionVariants: d.sectionVariants || {},
        }));
    }

    /**
     * Resolve a designKey to its sectionVariants map by reading the theme's
     * theme.json. When no key is given, falls back to `defaultDesignKey` or
     * the first declared design. Returns undefined if the theme has no
     * designs at all (so the seed data flows through untouched).
     */
    private async resolveDesignToVariantSelections(
        themeName: string,
        designKey?: string,
    ): Promise<Record<string, string> | undefined> {
        const designs = await this.getThemeDesigns(themeName).catch(() => []);
        if (!designs.length) return undefined;
        const picked =
            designs.find((d: any) => d.key === designKey) ||
            designs.find((d: any) => d.isDefault) ||
            designs[0];
        return picked?.sectionVariants || undefined;
    }

    /**
     * Switch the currently-active theme to a new design. Re-seeds its
     * pages with the design's sectionVariants so the whole site shifts
     * in one call. Users reach this from the Themes → Customize UI.
     */
    async setActiveDesign(designKey: string): Promise<{ message: string; results: any }> {
        const activeTheme = await this.getActiveTheme();
        if (!activeTheme) throw new BadRequestException('No active theme to update.');
        // Re-run the activation path with purgePrevious=false and
        // importDemoContent=true so only the active theme's pages get
        // re-seeded with the chosen design. Everything else stays.
        const themePath = this.findThemePath(activeTheme);
        if (!themePath) throw new BadRequestException(`Theme path not found for "${activeTheme}"`);
        const configPath = path.join(themePath, 'theme.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
        // ── Bundle shape (Phase 7, #117) ────────────────────────────
        // If theme.json declares `bundle.designs[]`, treat the design
        // key as a bundle key: write `active_theme_design` (read by
        // mergeActiveDesign at query time) and reseed pages from the
        // design's own seedData so new content lands. Tier-gated by
        // `bundleAccess`.
        if (config.bundle && Array.isArray(config.bundle.designs) && config.bundle.designs.length) {
            const bundleDesign = config.bundle.designs.find((d: any) => d?.key === designKey);
            if (!bundleDesign) {
                const known = config.bundle.designs.map((d: any) => d?.key).filter(Boolean).join(', ');
                throw new BadRequestException(`Design "${designKey}" not found in bundle. Known: ${known}`);
            }
            // Gate by *tier number*, not by short-name string. This is
            // the fix that makes bundleAccess work correctly across
            // personal-professional AND org-enterprise (same tier 3,
            // different short names) — both honour a design declared
            // as `["professional"]` OR `["enterprise"]`.
            const ct = await this.currentTier();
            if (!this.tierAllowsBundle(bundleDesign.bundleAccess, ct.tier)) {
                const allowed: string[] = bundleDesign.bundleAccess;
                throw new ForbiddenException(
                    `Design "${designKey}" requires one of [${allowed.join(', ')}] tier(s). You're on "${ct.shortName}" (tier ${ct.tier}).`,
                );
            }
            await (this.prisma as any).setting.upsert({
                where: { key: 'active_theme_design' },
                create: { key: 'active_theme_design', value: designKey },
                update: { value: designKey },
            });
            const bundleResults: Record<string, number> = {};
            const designSeed = bundleDesign.seedData;
            if (this.isModuleEnabled('pages') && Array.isArray(designSeed?.pages) && designSeed.pages.length) {
                bundleResults.pages = await this.setupPages(designSeed.pages, undefined);
            }
            return { message: `Design "${designKey}" activated on bundle "${activeTheme}"`, results: bundleResults };
        }

        // ── Flat / variant-only shape (legacy) ──────────────────────
        const seed = config.seedData || config.seed || {};
        const variantSelections = await this.resolveDesignToVariantSelections(activeTheme, designKey);

        // Persist the choice so other parts of the UI can show "current design".
        await this.prisma.setting.upsert({
            where: { key: `theme_design_${activeTheme}` },
            create: { key: `theme_design_${activeTheme}`, value: designKey },
            update: { value: designKey },
        });

        const results: Record<string, number> = {};
        if (this.isModuleEnabled('pages') && seed.pages?.length) {
            results.pages = await this.setupPages(seed.pages, variantSelections);
        }
        return { message: `Design "${designKey}" applied to ${activeTheme}`, results };
    }

    /**
     * Resolve the customer's current package into a short-name and a
     * tier number. The tier number is the authoritative gate value —
     * tier-3 customers can be on `personal-professional` OR
     * `org-enterprise` (different short-names, same access level), so
     * comparing by short-name alone misses one half of the customer
     * base. Use `tierAllowsBundle()` (below) to gate properly.
     *
     * Returned shape:
     *   shortName: the customer's specific tier label (used only for
     *              error messages — "you're on professional").
     *   tier:      1 (basic) · 2 (premium) · 3 (professional/enterprise)
     *              · 4 (custom). The integer the gate compares.
     *   pkgType:   'personal' | 'org' | 'unknown'. Surfaced so the
     *              error message can say "Premium" without needing to
     *              know whether the customer is on personal-premium or
     *              org-premium.
     */
    private async currentTier(): Promise<{ shortName: string; tier: number; pkgType: 'personal' | 'org' | 'unknown' }> {
        try {
            const row = await (this.prisma as any).setting.findUnique({ where: { key: 'active_package_id' } });
            const packageId: string = (row?.value && typeof row.value === 'string') ? row.value : 'personal-basic';
            const pkg = await (this.prisma as any).package.findUnique({ where: { id: packageId } });
            const tier: number = pkg?.tier || 1;
            const pkgType: 'personal' | 'org' | 'unknown' =
                packageId.startsWith('personal-') ? 'personal' :
                packageId.startsWith('org-')      ? 'org' : 'unknown';
            // Tier-3 splits by package type: personal → 'professional',
            // org → 'enterprise'. Other tiers share a name across both
            // sides. Falls back to 'basic' on unrecognised tier.
            const shortNamePersonal = ['basic', 'basic', 'premium', 'professional', 'custom'];
            const shortNameOrg      = ['basic', 'basic', 'premium', 'enterprise',   'custom'];
            const shortName = (pkgType === 'org' ? shortNameOrg : shortNamePersonal)[tier] || 'basic';
            return { shortName, tier, pkgType };
        } catch {
            return { shortName: 'basic', tier: 1, pkgType: 'unknown' };
        }
    }

    /**
     * Backwards-compat alias used by older call sites. Returns the
     * short-name for the customer's specific package side. New code
     * should use `currentTier()` and `tierAllowsBundle()` instead so
     * personal/org cross-equivalence works correctly.
     */
    private async currentTierShortName(): Promise<string> {
        return (await this.currentTier()).shortName;
    }

    /**
     * Decide whether a `bundleAccess: string[]` declaration permits
     * the customer's current tier.
     *
     * **Semantics: minimum-floor.** `bundleAccess: ['professional']`
     * means "tier 3 AND ABOVE". So a Custom-tier (4) customer always
     * inherits access to anything Professional / Premium / Basic
     * declares. This matches `minPackageTier` semantics elsewhere in
     * the system and avoids the surprise where a paid-up Custom
     * customer can't activate a design "meant for" Professional users.
     *
     * Tier-number-aware so personal/org cross-equivalence works:
     * `professional` and `enterprise` both resolve to tier 3, so the
     * lowest-floor for `['enterprise']` is the same as for
     * `['professional']` — admit any tier-3-or-above customer
     * regardless of which side of the personal/org split they're on.
     *
     * Special cases:
     *   - 'any' passes for any tier.
     *   - empty/missing bundleAccess passes (no restriction declared).
     *   - bundleAccess names that don't map to a known tier are
     *     ignored (defensive — typo-friendly).
     */
    private tierAllowsBundle(bundleAccess: string[] | undefined, currentTier: number): boolean {
        if (!Array.isArray(bundleAccess) || bundleAccess.length === 0) return true;
        if (bundleAccess.includes('any')) return true;
        const NAME_TO_TIER: Record<string, number> = {
            basic: 1,
            premium: 2,
            professional: 3,
            enterprise: 3,
            custom: 4,
        };
        // Find the LOWEST declared tier — that's the minimum floor the
        // customer must exceed. Customer at-or-above that tier passes.
        let floor = Infinity;
        for (const name of bundleAccess) {
            const t = NAME_TO_TIER[name];
            if (typeof t === 'number' && t < floor) floor = t;
        }
        if (floor === Infinity) return true; // all names unknown → don't lock
        return currentTier >= floor;
    }

    /**
     * Walk a named theme's pageSchema and return a flat list of sections that
     * declare variants. Used by the admin activation modal to render a
     * variant-picker step before seeding demo content.
     *
     * Shape:
     *   [
     *     {
     *       pageSlug: 'home',
     *       pageName: 'Home',
     *       sectionId: 'hero',
     *       sectionLabel: 'Hero with Code Card',
     *       variants: [{ key, label, description }, …],
     *       defaultVariantKey: 'dark',
     *     }, …
     *   ]
     */
    async getThemeVariants(themeName: string): Promise<any[]> {
        const themePath = this.findThemePath(themeName);
        if (!themePath) throw new BadRequestException(`Theme "${themeName}" not found`);

        const configPath = path.join(themePath, 'theme.json');
        if (!fs.existsSync(configPath)) return [];

        let config: any;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
        } catch (e) {
            console.warn(`[Themes] getThemeVariants: failed to parse ${configPath}:`, (e as Error).message);
            return [];
        }

        const pages: any[] = config.pageSchema || [];
        const out: any[] = [];

        // Resolve default variant keys by looking at the theme's seedData, so
        // the picker can preselect the variant the theme itself would seed.
        const seedPages: any[] = config.seedData?.pages ?? [];
        const seedDefaults: Record<string, string> = {};
        for (const sp of seedPages) {
            const secs = sp?.data?.sections ?? [];
            for (const s of secs) {
                if (s?.id && s?.data?._variant) {
                    seedDefaults[`${sp.slug}:${s.id}`] = s.data._variant;
                }
            }
        }

        for (const page of pages) {
            for (const sec of (page.sections || [])) {
                const type = sec.type || sec.id;
                const variants = Array.isArray(sec.variants) ? sec.variants : [];
                if (!type || variants.length === 0) continue;
                out.push({
                    pageSlug: page.slug,
                    pageName: page.name || page.slug,
                    sectionId: type,
                    sectionLabel: sec.label || type,
                    variants: variants.map((v: any) => ({
                        key: v.key,
                        label: v.label || v.key,
                        description: v.description,
                    })),
                    defaultVariantKey: seedDefaults[`${page.slug}:${type}`] ?? variants[0]?.key ?? null,
                });
            }
        }
        return out;
    }

    /**
     * Return a unique list of all section types defined in the theme's page schema.
     * This acts as a "Section Palette" for the advanced page builder.
     */
    async getSectionPalette(): Promise<any[]> {
        const config = await this.getActiveThemeConfig();
        const pages: any[] = config?.pageSchema || [];
        const palette = new Map<string, any>();

        for (const page of pages) {
            for (const sec of (page.sections || [])) {
                const type = sec.type || sec.id;
                if (!type) continue;
                if (!palette.has(type)) {
                    palette.set(type, {
                        ...sec,
                        id: type,
                        type: type,
                        label: sec.label || (type.charAt(0).toUpperCase() + type.slice(1)),
                    });
                }
            }
        }

        return Array.from(palette.values());
    }

    /** Return module aliases (e.g. { team: 'Our Team' }). */
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
     * Upsert collection schemas declared in theme.json's requiredCollections array.
     * Each entry: { name, slug, type, description?, fields[] }
     * Also seeds initial items from collectionItems[slug][] if provided in seedData.
     */
    private async setupRequiredCollections(
        requiredCollections: any[],
        collectionItems: Record<string, any[]>,
    ): Promise<number> {
        let count = 0;
        for (const colDef of requiredCollections) {
            if (!colDef.slug || !colDef.name) continue;
            const collection = await (this.prisma as any).collection.upsert({
                where: { slug: colDef.slug },
                create: {
                    name: colDef.name,
                    slug: colDef.slug,
                    description: colDef.description || null,
                    type: colDef.type || 'COLLECTION',
                    fields: colDef.fields || [],
                },
                update: {
                    name: colDef.name,
                    description: colDef.description || null,
                    type: colDef.type || 'COLLECTION',
                    fields: colDef.fields || [],
                },
            });
            count++;

            // Seed initial items if provided (only if collection has no items yet)
            const items: any[] = collectionItems[colDef.slug] || [];
            if (items.length > 0) {
                const existing = await (this.prisma as any).collectionItem.count({ where: { collectionId: collection.id } });
                if (existing === 0) {
                    for (const item of items) {
                        await (this.prisma as any).collectionItem.create({
                            data: {
                                collectionId: collection.id,
                                data: item.data || item,
                                slug: item.slug || null,
                                isPublished: item.isPublished !== false,
                            },
                        });
                    }
                }
            }
        }
        return count;
    }

    /**
     * Import media files from {themePath}/media/ AND {themePath}/public/
     * into the CMS media library. Copies files to uploads/ and creates
     * Media DB records. Skips files already present in the DB.
     *
     * Why scan public/ too: theme designers ship demo images (character
     * SVGs, hero illustrations, emblem watermarks, dashboard mockups)
     * in the theme's public/ folder. Without this scan they're served
     * statically by the theme dev server but invisible in the admin's
     * media library — so editors who open the SectionEditor's image
     * picker see an empty gallery even though the design clearly has
     * visible images. Scanning public/ on activation makes them
     * pickable like any uploaded image.
     *
     * Skipped files: favicon.ico, manifest.json, robots.txt, sitemap.xml,
     * and anything starting with a dot (hidden files). These are infra-
     * level assets not meant for editor consumption.
     */
    private async setupMedia(themePath: string, explicitItems: any[]): Promise<number> {
        const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']);
        const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi']);
        // Files we never want to import — they're page-infrastructure,
        // not editorial assets. Listed by exact filename so a theme can
        // legitimately ship a generic-named asset (e.g. logo.png) and
        // we'll still import it.
        const SKIP_FILENAMES = new Set([
            'favicon.ico', 'manifest.json', 'robots.txt', 'sitemap.xml',
            'browserconfig.xml',
        ]);

        const folders: { dir: string; folder: string }[] = [];
        const mediaDir = path.join(themePath, 'media');
        if (fs.existsSync(mediaDir)) folders.push({ dir: mediaDir, folder: 'theme-assets' });
        const publicDir = path.join(themePath, 'public');
        if (fs.existsSync(publicDir)) folders.push({ dir: publicDir, folder: 'theme-public' });

        if (folders.length === 0) return 0;

        let count = 0;
        for (const { dir, folder } of folders) {
            const files = fs.readdirSync(dir, { withFileTypes: true })
                .filter(d => d.isFile())
                .map(d => d.name)
                .filter(f => {
                    if (f.startsWith('.')) return false;
                    if (SKIP_FILENAMES.has(f)) return false;
                    const ext = path.extname(f).toLowerCase();
                    return IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext);
                });

            for (const file of files) {
                const srcPath = path.join(dir, file);
                const destPath = path.join(this.mediaUploadPath, file);

                // Copy to uploads if not already there. We never overwrite
                // an existing file — could clobber an upload the user
                // intentionally made with the same name.
                if (!fs.existsSync(destPath)) {
                    try { fs.copyFileSync(srcPath, destPath); }
                    catch (e) { console.warn(`[Themes] Failed to copy ${file}:`, (e as Error).message); continue; }
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
                        folder,
                    },
                });
                count++;
            }
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

    /**
     * Return the active theme's branding-field contract — the set of
     * settings keys the theme actually respects, grouped by category
     * (Identity / Colors / Typography / Layout). The admin's branding
     * settings page reads this to render only the controls a given
     * theme uses, so swapping themes hides irrelevant fields.
     *
     * Falls back to a sensible 16-key default if the theme.json doesn't
     * declare its own contract — older themes still get every control.
     */
    async getBrandingFields(): Promise<any[]> {
        const config = await this.getActiveThemeConfig();
        const declared = (config as any)?.brandingFields;
        if (Array.isArray(declared) && declared.length) return declared;
        // Default contract used by themes that don't declare one.
        return [
            {
                group: 'Identity',
                fields: [
                    { key: 'site_title',       label: 'Master Site Descriptor',     type: 'string', fallback: 'Mero CMS' },
                    { key: 'site_tagline',     label: 'Brand Tagline',              type: 'string', fallback: '' },
                    { key: 'copyright_text',   label: 'Copyright Disclaimer',       type: 'string', fallback: '' },
                    { key: 'logo_url',         label: 'Brand Assets / Logo',        type: 'media',  fallback: null },
                    { key: 'favicon_url',      label: 'Infrastructure / Favicon',   type: 'media',  fallback: null },
                    { key: 'meta_description', label: 'Meta description',           type: 'text',   fallback: null },
                ],
            },
            {
                group: 'Colors',
                fields: [
                    { key: 'primary_color',    label: 'Brand Identity / Primary Accent', type: 'color', fallback: '#cb172b', cssVar: '--brand' },
                    { key: 'secondary_color',  label: 'Secondary Color',                 type: 'color', fallback: '#023d91', cssVar: '--navy' },
                    { key: 'accent_color',     label: 'Accent / Background Color',       type: 'color', fallback: '#fbfaf6', cssVar: '--paper' },
                    { key: 'text_color',       label: 'Body text color',                 type: 'color', fallback: '#0d0e14', cssVar: '--ink' },
                    { key: 'heading_color',    label: 'Heading text color',              type: 'color', fallback: '#2a2c35', cssVar: '--ink-2' },
                    { key: 'link_color',       label: 'Link color',                      type: 'color', fallback: '#023d91', cssVar: '--link' },
                    { key: 'muted_text_color', label: 'Muted / Caption color',           type: 'color', fallback: '#5b5e6b', cssVar: '--ink-3' },
                ],
            },
            {
                group: 'Typography',
                fields: [
                    { key: 'heading_font',  label: 'Heading Font',     type: 'font',   fallback: 'Bricolage Grotesque', cssVar: '--font-display' },
                    { key: 'body_font',     label: 'Body Font',        type: 'font',   fallback: 'Inter',               cssVar: '--font-body' },
                    { key: 'base_font_size',label: 'Base Font Size',   type: 'size',   fallback: '16px',                cssVar: '--base-fs' },
                    { key: 'heading_weight',label: 'Heading Weight',   type: 'weight', fallback: '800',                 cssVar: '--hw' },
                    { key: 'body_weight',   label: 'Body Weight',      type: 'weight', fallback: '400',                 cssVar: '--bw' },
                ],
            },
            {
                group: 'Layout',
                fields: [
                    { key: 'border_radius', label: 'Global Border Radius', type: 'size',   fallback: '20px',         cssVar: '--r-md' },
                    { key: 'layout_density',label: 'Layout Density',       type: 'select', fallback: 'comfortable',  cssVar: '--density',
                      options: ['compact', 'comfortable', 'spacious'] },
                ],
            },
        ];
    }
}
