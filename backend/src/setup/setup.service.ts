import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SetupProgressService } from './setup-progress.service';
import * as bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export const CORE_MODULES = [
    'auth', 'users', 'roles', 'settings', 'media',
    'audit-log', 'mail', 'notifications', 'invitations', 'tasks',
    'themes',
];

// Modules selectable in the setup wizard — generic CMS features not tied to any theme.
// Theme-specific modules (team, services, testimonials, leads, menus, etc.) are NOT listed
// here; they are auto-enabled when a theme declaring them in requiredModules is activated.
export const OPTIONAL_MODULES = [
    'blogs', 'categories', 'tags', 'comments',
    'collections',
    'seo', 'redirects', 'analytics', 'sitemap', 'robots',
    'pages', 'forms',
];

export const MODULE_LABELS: Record<string, { label: string; description: string; group: string }> = {
    blogs: { label: 'Blog', description: 'Blog posts with categories, tags, and comments', group: 'Content' },
    categories: { label: 'Blog Categories', description: 'Categorize blog posts', group: 'Content' },
    tags: { label: 'Blog Tags', description: 'Tag blog posts for filtering', group: 'Content' },
    comments: { label: 'Comments', description: 'Reader comments on blog posts', group: 'Content' },
    menus: { label: 'Navigation Menus', description: 'Dynamic nested menu management', group: 'Site' },
    pages: { label: 'Static Pages', description: 'Custom page management', group: 'Site' },
    themes: { label: 'Themes', description: 'Upload and manage website themes', group: 'Site' },
    forms: { label: 'Forms', description: 'Form builder with submission management', group: 'Content' },
    collections: { label: 'Collections', description: 'Custom content types with dynamic field schemas', group: 'Content' },
    team: { label: 'Team', description: 'Manage team members and staff profiles', group: 'Content' },
    testimonials: { label: 'Testimonials', description: 'Manage customer feedback and success stories', group: 'Content' },
    services: { label: 'Services', description: 'Manage product or service offerings', group: 'Content' },
    leads: { label: 'Leads', description: 'Track business inquiries and potential customers', group: 'Content' },
    seo: { label: 'SEO Tools', description: 'Meta tags, redirects, robots.txt, sitemap', group: 'SEO & Analytics' },
    redirects: { label: 'URL Redirects', description: 'Manage 301/302 redirects', group: 'SEO & Analytics' },
    analytics: { label: 'Analytics', description: 'Google Analytics 4 integration and dashboard', group: 'SEO & Analytics' },
    sitemap: { label: 'Sitemap', description: 'Auto-generated XML sitemap', group: 'SEO & Analytics' },
    robots: { label: 'Robots.txt', description: 'Manage search engine crawl rules', group: 'SEO & Analytics' },
};

export const MODULE_TIERS: Record<string, number> = {
    seo: 2,
    redirects: 2,
    analytics: 2,
    sitemap: 2,
    robots: 2,
    webhooks: 2,
    collections: 3,
    comments: 3,
};

@Injectable()
export class SetupService {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
        private progress: SetupProgressService,
    ) { }

    /**
     * Resolve the directory used for persistent boot-time state files
     * (`setup.json`, `secrets.json`). Mirrors `meroDataDir()` in
     * `main.ts` so the wizard writes to the same location the bootstrap
     * code reads from. In Docker we set `MERO_DATA_DIR=/app/data` and
     * mount a named volume there so the wizard's saved license / DB
     * config / site URL survive container rebuilds.
     */
    private dataDir(): string {
        const fromEnv = (process.env.MERO_DATA_DIR || '').trim();
        if (fromEnv) {
            try {
                if (!fs.existsSync(fromEnv)) fs.mkdirSync(fromEnv, { recursive: true });
                return fromEnv;
            } catch {
                /* fall through to cwd */
            }
        }
        return process.cwd();
    }

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

    /**
     * Returns where the live DATABASE_URL came from. The wizard uses
     * this to skip the (otherwise pointless) database step when an env
     * var or .env file is the source of truth — env-driven deployments
     * (Docker, Railway, .env file pre-populated) shouldn't be asked to
     * re-enter credentials, and the wizard MUST NOT overwrite an
     * env-sourced URL with whatever the customer types in.
     *
     * `source` values:
     *   - 'env'        DATABASE_URL was set in process.env BEFORE we
     *                  read setup.json. The wizard should skip the DB
     *                  step entirely. saveDatabaseConfig will refuse
     *                  to overwrite this.
     *   - 'setup.json' DATABASE_URL came from setup.json (i.e. a
     *                  previous wizard run). The wizard may show the
     *                  step pre-filled and let the user re-save.
     *   - 'unset'      No DATABASE_URL anywhere. The wizard MUST show
     *                  the DB step — there's nothing to use yet.
     *
     * The stamp itself is set in `bootstrapSetupConfig()` in main.ts.
     */
    getDatabaseStatus(): {
        configured: boolean;
        source: 'env' | 'setup.json' | 'unset';
        managedByEnv: boolean;
    } {
        const url = (process.env.DATABASE_URL || '').trim();
        const raw = (process.env._DATABASE_URL_SOURCE || '').toLowerCase();
        const source: 'env' | 'setup.json' | 'unset' =
            raw === 'env' ? 'env'
            : raw === 'setup.json' ? 'setup.json'
            : url ? 'env' /* fallback if stamp missing but URL present */
            : 'unset';
        return {
            configured: !!url,
            source,
            managedByEnv: source === 'env',
        };
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
        /** Optional license key from the wizard's License step. Persisted
            to setup.json so subsequent boots have it without env vars. */
        licenseKey?: string;
    }) {
        // Bracket the whole flow with a top-level event so the terminal
        // can paint a header. Each numbered phase below pairs a
        // started/completed event so the UI can render checkmarks.
        this.progress.started('setup', 'Starting Mero CMS setup…');

        // Persist the license key first so the rest of the setup can use it.
        if (data.licenseKey?.trim()) {
            this.progress.started('license', 'Activating license key…');
            const setupPath = path.join(this.dataDir(), 'setup.json');
            let setupJson: Record<string, any> = {};
            try {
                if (fs.existsSync(setupPath)) {
                    setupJson = JSON.parse(fs.readFileSync(setupPath, 'utf8'));
                }
            } catch { /* fall through */ }
            setupJson.licenseKey = data.licenseKey.trim();
            setupJson.licenseActivatedAt = new Date().toISOString();
            fs.writeFileSync(setupPath, JSON.stringify(setupJson, null, 2), { mode: 0o600 });
            // Hydrate the current process so LicenseService picks it up
            // without a restart.
            process.env.LICENSE_KEY = data.licenseKey.trim();
            this.progress.completed('license', 'License activated.');
        }

        const alreadyComplete = await this.isSetupComplete();
        if (alreadyComplete) {
            this.progress.failed('setup', 'Setup already completed');
            throw new BadRequestException('Setup has already been completed');
        }

        // Resolve paths: __dirname = dist/setup or src/setup → up to backend root
        const backendRoot = path.join(__dirname, '..', '..');
        const projectRoot = path.join(backendRoot, '..');
        // In Docker, set SCRIPTS_DIR=/scripts (volume-mounted); in dev it falls back to ../scripts
        const scriptsDir = process.env.SCRIPTS_DIR || path.join(projectRoot, 'scripts');
        const buildScriptPath = path.join(scriptsDir, 'build-schema.js');

        // 1. Assemble minimal schema for selected modules (dev only; skipped in Docker/production)
        if (fs.existsSync(buildScriptPath)) {
            const moduleList = data.enabledModules.join(',');
            this.progress.started('schema-build', `Building schema for modules: ${moduleList || '(core only)'}`);
            console.log(`[Setup] Building schema for modules: ${moduleList || '(core only)'}`);
            try {
                execSync(`node "${buildScriptPath}" ${moduleList}`, {
                    cwd: backendRoot,
                    stdio: 'inherit',
                });
                this.progress.completed('schema-build', 'Schema assembled.');
            } catch (err: any) {
                this.progress.failed('schema-build', 'Schema build failed.', err?.message);
                throw err;
            }
        } else {
            this.progress.completed('schema-build', 'Using prebuilt schema (production image).');
            console.log('[Setup] build-schema.js not found — using committed schema.prisma as-is');
        }

        // 2. Push schema to DB — creates only the needed tables
        this.progress.started('db-push', 'Pushing schema to database…');
        console.log('[Setup] Running prisma db push...');
        try {
            execSync('npx prisma db push --accept-data-loss', {
                cwd: backendRoot,
                stdio: 'inherit',
            });
            this.progress.completed('db-push', 'Database tables created.');
        } catch (err: any) {
            this.progress.failed('db-push', 'Schema push failed.', err?.message);
            throw err;
        }

        // 3. Create Super Admin role if it doesn't exist
        this.progress.started('roles', 'Creating Super Admin role…');
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
        this.progress.completed('roles', 'Roles ready.');

        // 4. Create admin user if none exist
        this.progress.started('admin-user', `Creating admin user (${data.adminEmail})…`);
        const existingUser = await (this.prisma as any).user.findFirst();
        if (!existingUser) {
            // 12 rounds, matching auth.service + users.service. The initial
            // admin password deserves the same hash strength as every other
            // user password created through the app.
            const hashed = await bcrypt.hash(data.adminPassword, 12);
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
        this.progress.completed('admin-user', 'Admin user ready.');

        // 5. Store enabled modules in DB settings
        this.progress.started('settings', 'Persisting site settings…');
        const allModules = [...new Set([...CORE_MODULES, ...data.enabledModules])];
        await this.settingsService.updateMany({
            site_title: data.siteName,
            enabled_modules: JSON.stringify(allModules),
            setup_complete: 'true',
            // Secure-by-default on first install. completeSetup is guarded
            // by isSetupComplete() so this block only runs once per database,
            // meaning existing installs upgrading past this version keep
            // whatever the admin has already toggled in the Security tab.
            security_session_locking: 'true',
            security_failed_login_limit: 'true',
            lockout_threshold: '5',
            lockout_duration: '15',
            // 2FA enforcement is off by default — turning it on globally on
            // a fresh install would lock out the admin who just finished the
            // wizard before they know what 2FA is. Admins opt into this via
            // the Security settings tab once they have an authenticator app.
            security_force_2fa_for_admins: 'false',
        });
        this.progress.completed('settings', 'Settings written.');

        // 6. Write ENABLED_MODULES to .env so it persists after restart
        this.progress.started('env', 'Writing environment file…');
        this.writeEnvVars(backendRoot, {
            ENABLED_MODULES: data.enabledModules.join(','),
            SETUP_COMPLETE: 'true',
        });
        this.progress.completed('env', '.env updated.');

        // Restart is only needed if the app was running in selective mode before
        // (env var SETUP_COMPLETE was already 'true'). On a fresh Railway deploy
        // SETUP_COMPLETE isn't in env vars, so all modules are already loaded —
        // no restart needed. On local dev after the FIRST setup the process will
        // restart so that app.module.ts picks up the new selective-loading state.
        const wasAlreadySelective =
            process.env.SETUP_COMPLETE === 'true' &&
            (process.env.ENABLED_MODULES || '').trim().length > 0;
        const needsRestart = !wasAlreadySelective;

        if (needsRestart) {
            this.progress.completed('setup', 'Setup complete. Restarting server…');
            console.log('[Setup] Complete. Restarting server...');
            setTimeout(() => {
                if (process.env.NODE_ENV !== 'production') {
                    const mainPath = path.join(backendRoot, 'src', 'main.ts');
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
            this.progress.completed('setup', 'Setup complete. No restart needed.');
            console.log('[Setup] Complete. No restart needed (already in selective mode).');
        }

        return { success: true, enabledModules: allModules, needsRestart };
    }

    async updateEnabledModules(modules: string[]) {
        const allModules = [...new Set([...CORE_MODULES, ...modules])];

        const backendRoot = path.join(__dirname, '..', '..');
        const projectRoot = path.join(backendRoot, '..');
        const scriptsDir2 = process.env.SCRIPTS_DIR || path.join(projectRoot, 'scripts');
        const buildScriptPath = path.join(scriptsDir2, 'build-schema.js');

        if (fs.existsSync(buildScriptPath)) {
            const moduleList = modules.join(',');
            console.log(`[Setup] Updating schema for modules: ${moduleList}`);
            execSync(`node "${buildScriptPath}" ${moduleList}`, {
                cwd: backendRoot,
                stdio: 'inherit',
            });
        } else {
            console.log('[Setup] build-schema.js not found — using committed schema.prisma as-is');
        }
        execSync('npx prisma db push --accept-data-loss', {
            cwd: backendRoot,
            stdio: 'inherit',
        });

        await this.settingsService.update('enabled_modules', JSON.stringify(allModules));

        this.writeEnvVars(backendRoot, {
            ENABLED_MODULES: modules.join(','),
        });

        // A process restart is only needed when running in selective-module mode
        // (SETUP_COMPLETE=true + ENABLED_MODULES set as env vars), because in that
        // mode app.module.ts bakes the module list at startup and needs a reload.
        // In non-selective mode (Railway/Docker where those env vars aren't set),
        // all modules are already loaded — a DB update is enough, no restart needed.
        const isSelectiveMode =
            process.env.SETUP_COMPLETE === 'true' &&
            (process.env.ENABLED_MODULES || '').trim().length > 0;

        if (isSelectiveMode) {
            console.log('[Setup] Complete. Restarting server...');
            setTimeout(() => {
                if (process.env.NODE_ENV !== 'production') {
                    const mainPath = path.join(backendRoot, 'src', 'main.ts');
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
        }

        return { enabledModules: allModules, needsRestart: isSelectiveMode };
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

    /**
     * Test a PostgreSQL connection without persisting it. Used by the
     * setup wizard's "Test connection" button so customers can validate
     * their DB credentials before committing them.
     *
     * Connects via a temporary PrismaClient instance. Returns
     * { success: true } on a successful `$connect` + simple `SELECT 1`,
     * or { success: false, error: string } otherwise.
     */
    async testDatabaseConnection(opts: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        ssl?: boolean;
    }): Promise<{ success: boolean; error?: string; provider: string }> {
        const url = this.buildDatabaseUrl(opts);
        try {
            // Lazy require so Nest's DI doesn't try to instantiate this.
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { PrismaClient } = require('@prisma/client');
            const client = new PrismaClient({
                datasources: { db: { url } },
                log: ['error'],
            });
            await client.$connect();
            await client.$queryRaw`SELECT 1`;
            await client.$disconnect();
            return { success: true, provider: 'postgresql' };
        } catch (err: any) {
            return {
                success: false,
                provider: 'postgresql',
                error: err?.message?.slice(0, 200) || 'Connection failed.',
            };
        }
    }

    /**
     * Save the verified DB connection so subsequent boots use it without
     * the customer touching .env. Writes to:
     *   1. `setup.json` — read by main.ts on boot to populate DATABASE_URL
     *      when not already set in env.
     *   2. `.env` — also persisted there as a fallback for tools (Prisma
     *      CLI, etc.) that read directly from .env.
     *
     * Optionally runs `prisma migrate deploy` to bring the new database
     * to schema parity. If migrations fail, we don't roll back the URL —
     * the customer can fix the issue and retry from the wizard.
     */
    async saveDatabaseConfig(opts: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        ssl?: boolean;
        runMigrations?: boolean;
    }): Promise<{ success: boolean; migrationsRan: boolean; restartRequired: boolean; error?: string }> {
        // Refuse to clobber an env-sourced DATABASE_URL. If the operator
        // (or their hosting platform — Docker / Railway / k8s) set the URL
        // via env, that's the source of truth; letting the wizard write
        // a different one to .env / setup.json would put the install in
        // a confusing two-sources state where every restart bounces back
        // to whatever env says. Self-hosters who want to change DBs
        // should edit env directly.
        const dbStatus = this.getDatabaseStatus();
        if (dbStatus.managedByEnv) {
            throw new BadRequestException(
                'DATABASE_URL is configured via environment — the setup wizard cannot override it. Update your .env or hosting environment instead.',
            );
        }

        const url = this.buildDatabaseUrl(opts);

        // Persist to setup.json (the new canonical location). Uses
        // MERO_DATA_DIR when set (Docker volumes) so the saved DB URL
        // survives container rebuilds.
        const setupPath = path.join(this.dataDir(), 'setup.json');
        let setupJson: Record<string, any> = {};
        try {
            if (fs.existsSync(setupPath)) {
                setupJson = JSON.parse(fs.readFileSync(setupPath, 'utf8'));
            }
        } catch { /* fall through with empty object */ }
        setupJson.database = {
            provider: 'postgresql',
            url,
            host: opts.host,
            port: opts.port,
            database: opts.database,
            // Don't store the password in cleartext alongside the URL —
            // the URL already contains it but at least don't duplicate.
            username: opts.username,
            ssl: !!opts.ssl,
            configuredAt: new Date().toISOString(),
        };
        fs.writeFileSync(setupPath, JSON.stringify(setupJson, null, 2), { mode: 0o600 });

        // Mirror to .env for Prisma CLI compatibility.
        try {
            this.upsertEnvKeys({ DATABASE_URL: url });
        } catch (err: any) {
            return {
                success: true,
                migrationsRan: false,
                restartRequired: true,
                error: `Saved to setup.json but could not write .env: ${err?.message}`,
            };
        }

        // Optionally sync the schema to the new database.
        //
        // We use `prisma db push` rather than `migrate deploy` because:
        //   1. Fresh installs don't have a `prisma/migrations` folder
        //      yet — `migrate deploy` requires one and fails otherwise.
        //   2. The existing `completeSetup()` flow uses db push for the
        //      same reason (lines ~141 and ~255 elsewhere in this file),
        //      so we're being consistent.
        //   3. The schema is assembled at first-run by `build-schema.js`
        //      from the modules the customer ticked, so each install's
        //      schema is unique — migrations would have to be generated
        //      per-install, which `db push` sidesteps entirely.
        //
        // `--accept-data-loss` is safe on a fresh database (no data to
        // lose) and makes the command non-interactive.
        let migrationsRan = false;
        if (opts.runMigrations) {
            try {
                execSync('npx prisma db push --accept-data-loss --skip-generate', {
                    cwd: process.cwd(),
                    env: { ...process.env, DATABASE_URL: url },
                    stdio: 'pipe',
                });
                migrationsRan = true;
            } catch (err: any) {
                // Capture both stdout and stderr — execSync error.message
                // truncates Prisma's actual output, which is where the
                // useful diagnostic lives.
                const stderr = err?.stderr?.toString?.() || '';
                const stdout = err?.stdout?.toString?.() || '';
                const detail = (stderr || stdout || err?.message || 'unknown error').toString().slice(0, 600);
                return {
                    success: true,
                    migrationsRan: false,
                    restartRequired: true,
                    error: `DB saved, but schema push failed: ${detail}`,
                };
            }
        }

        return { success: true, migrationsRan, restartRequired: true };
    }

    /** Build a postgresql:// connection string from form fields. */
    private buildDatabaseUrl(opts: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        ssl?: boolean;
    }): string {
        const u = encodeURIComponent(opts.username);
        const p = encodeURIComponent(opts.password);
        const sslParam = opts.ssl ? '?sslmode=require' : '';
        return `postgresql://${u}:${p}@${opts.host}:${opts.port}/${opts.database}${sslParam}`;
    }

    /** Internal helper used by testDatabaseConnection / saveDatabaseConfig
        to write key=value pairs to .env. */
    private upsertEnvKeys(updates: Record<string, string>) {
        const envPath = path.join(process.cwd(), '.env');
        let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        for (const [key, value] of Object.entries(updates)) {
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
