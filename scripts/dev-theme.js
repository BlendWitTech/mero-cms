#!/usr/bin/env node
/**
 * dev-theme.js
 *
 * Reads the active theme from the CMS backend and starts it on port 3002.
 * When no theme is active, falls back to mero-pro (the only bundled
 * theme).
 * Watches for active theme changes every 4s and hot-swaps automatically.
 *
 * Usage:
 *   node scripts/dev-theme.js
 *   npm run dev:theme
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_URL = process.env.CMS_API_URL || 'http://localhost:3001';
const THEMES_DIR = path.join(__dirname, '..', 'themes');
const PLACEHOLDER_THEME = 'mero-pro';
const STARTUP_WAIT_MS = 15000;
const WATCH_INTERVAL_MS = 4000;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchActiveTheme() {
    try {
        const res = await fetch(`${API_URL}/public/site-data`, {
            signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
            const data = await res.json();
            return data?.settings?.activeTheme || null;
        }
    } catch {
        // Backend unreachable
    }
    return null;
}

/**
 * Read the theme-restart counter the backend bumps on every activation.
 *
 * The backend's setActiveTheme() — including re-activation of the SAME
 * theme name — increments a `theme_restart_counter` setting. The
 * orchestrator polls that value alongside the active-theme name. When
 * either changes, it stops the current child and runs prepareTheme +
 * startTheme.
 *
 * This is what makes "re-activate to re-seed" actually pick up the
 * fresh content: without it, the orchestrator only restarted on theme
 * NAME changes, so re-activating mero-pro while it was already
 * active was a no-op for the running process.
 */
async function fetchRestartCounter() {
    try {
        const res = await fetch(`${API_URL}/public/site-data`, {
            signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
            const data = await res.json();
            return data?.settings?.themeRestartCounter ?? 0;
        }
    } catch {
        // Backend unreachable
    }
    return 0;
}

async function waitForBackend() {
    const start = Date.now();
    while (Date.now() - start < STARTUP_WAIT_MS) {
        const theme = await fetchActiveTheme();
        if (theme !== null || Date.now() - start > STARTUP_WAIT_MS - WATCH_INTERVAL_MS) {
            return theme;
        }
        process.stdout.write('.');
        await sleep(1000);
    }
    return null;
}

function themeExists(name) {
    return name && fs.existsSync(path.join(THEMES_DIR, name));
}

/**
 * Given an active theme value (directory name or theme.json slug), return the actual directory name.
 * Searches all theme directories' theme.json for a matching slug if direct name not found.
 */
function resolveThemeDirName(name) {
    if (!name) return null;
    if (fs.existsSync(path.join(THEMES_DIR, name))) return name;
    // Search by slug in theme.json files
    if (fs.existsSync(THEMES_DIR)) {
        const dirs = fs.readdirSync(THEMES_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'));
        for (const dir of dirs) {
            const configPath = path.join(THEMES_DIR, dir.name, 'theme.json');
            if (fs.existsSync(configPath)) {
                try {
                    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    if (config.slug === name) return dir.name;
                } catch { }
            }
        }
    }
    return name; // fallback
}

/**
 * Returns the theme to start: the active theme if it exists on disk, else
 * the placeholder if that exists, else any first directory under themes/.
 * Returns null when the themes/ folder is completely empty — callers then
 * skip the theme dev-server entirely and just print a hint.
 */
function resolveTheme(activeTheme) {
    const dirName = resolveThemeDirName(activeTheme);
    if (themeExists(dirName)) return dirName;
    if (fs.existsSync(path.join(THEMES_DIR, PLACEHOLDER_THEME))) return PLACEHOLDER_THEME;
    if (!fs.existsSync(THEMES_DIR)) return null;
    const dirs = fs.readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
        .map(d => d.name);
    return dirs[0] || null;
}

/**
 * Integrity canaries — files we expect to find in a healthy theme node_modules.
 *
 * `next-canary` catches the case where node_modules was wiped mid-install or
 * partially pruned — Turbopack throws "Can't resolve ../../page-path/ensure-
 * leading-slash" the moment you import any page.
 *
 * `swc-canary` catches the @swc/helpers MODULE_NOT_FOUND on Windows — by
 * far the most common breakage in this codebase. The Next dev server holds
 * `next-swc.win32-x64-msvc.node` memory-mapped, so when something tries to
 * wipe node_modules on Windows the locked file blocks deletion and leaves
 * the tree in a half-broken state where @swc/helpers is gone but everything
 * else looks fine. The legacy probe missed this entirely because it only
 * checked the Next canary; the full tree appeared "healthy" while every
 * SSR returned 500.
 */
const NEXT_INTEGRITY_CANARY = path.join(
    'next',
    'dist',
    'shared',
    'lib',
    'router',
    'utils',
    'page-path',
    'ensure-leading-slash.js',
);
const SWC_HELPERS_CANARY = path.join('@swc', 'helpers', 'package.json');

function checkIntegrity(themePath) {
    const nm = path.join(themePath, 'node_modules');
    if (!fs.existsSync(nm)) return { ok: false, missing: 'node_modules' };
    const pkgPath = path.join(themePath, 'package.json');
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const hasNext = !!(pkg.dependencies?.next || pkg.devDependencies?.next);
        if (!hasNext) return { ok: true, missing: null };
    } catch {
        return { ok: true, missing: null }; // Can't read package.json → don't force reinstall
    }
    if (!fs.existsSync(path.join(nm, NEXT_INTEGRITY_CANARY))) {
        return { ok: false, missing: 'next' };
    }
    if (!fs.existsSync(path.join(nm, SWC_HELPERS_CANARY))) {
        return { ok: false, missing: '@swc/helpers' };
    }
    return { ok: true, missing: null };
}

// Back-compat alias — older code paths may still call this.
function isThemeInstallHealthy(themePath) {
    return checkIntegrity(themePath).ok;
}

function wipeDir(p) {
    try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); }
    catch { /* best-effort — file locks on Windows are caller's problem */ }
}

function prepareTheme(themeName) {
    const themePath = path.join(THEMES_DIR, themeName);
    const themeNodeModules = path.join(themePath, 'node_modules');
    const themeNextCache = path.join(themePath, '.next');

    const integrity = checkIntegrity(themePath);

    // Decision tree:
    //   • Missing node_modules entirely → fresh install
    //   • Only @swc/helpers missing → targeted single-package install.
    //     Fast, doesn't touch any locked Next files, sidesteps the
    //     Windows file-lock issue entirely. THIS is the path that fires
    //     on the recurring "after setup the theme 500s" symptom — the
    //     orchestrator (mero.js) restarts dev:all, the previous theme
    //     dev server's @swc/helpers got partially deleted, and now a
    //     simple `npm install @swc/helpers` repaints just that file.
    //   • Anything else corrupt → wipe + full reinstall. We DO NOT kill
    //     other node processes here because that would also kill the
    //     user's backend (port 3001) and admin (port 3000). For the
    //     nuclear case the user runs `npm run repair-theme` manually
    //     (kills everything, fully resets).
    if (integrity.missing === 'node_modules') {
        console.log(`\n   Installing dependencies for "${themeName}"...`);
        execSync('npm install --prefer-offline --no-audit --no-fund', { cwd: themePath, stdio: 'inherit' });
    } else if (integrity.missing === '@swc/helpers') {
        console.log(`\n   [HEAL] @swc/helpers missing in "${themeName}" — installing just that package.`);
        let healed = false;
        // Strategy 1: targeted single-package install. Cheapest, but
        // sometimes fails (transient registry hiccup, --prefer-offline
        // cache miss, sub-process aborted, etc).
        try {
            execSync('npm install --no-save --prefer-offline --no-audit --no-fund @swc/helpers', {
                cwd: themePath,
                stdio: 'inherit',
            });
            healed = fs.existsSync(path.join(themeNodeModules, SWC_HELPERS_CANARY));
            if (healed) console.log(`   [HEAL] @swc/helpers restored.`);
        } catch (e) {
            console.warn(`   [HEAL] Targeted install failed (${e.message}) — falling back to full install.`);
        }
        // Strategy 2: full `npm install` against the existing tree. This
        // is idempotent: npm only adds what's missing, doesn't touch
        // what's there. Even on Windows with the dev server running, it
        // won't try to overwrite locked binary files because everything
        // it cares about is already healthy except @swc/helpers.
        if (!healed) {
            try {
                execSync('npm install --prefer-offline --no-audit --no-fund', {
                    cwd: themePath,
                    stdio: 'inherit',
                });
                healed = fs.existsSync(path.join(themeNodeModules, SWC_HELPERS_CANARY));
                if (healed) console.log(`   [HEAL] @swc/helpers restored via full install.`);
            } catch (e) {
                console.warn(`   [HEAL] Full install failed (${e.message}).`);
            }
        }
        if (!healed) {
            console.error(
                `\n❌  Could not heal @swc/helpers automatically.\n` +
                `   Stop dev:all and run from the project root:\n` +
                `       npm run repair-theme\n` +
                `   Then re-run \`npm run dev:all\`. The theme will 500 until this is resolved.\n`,
            );
        }
    } else if (!integrity.ok) {
        console.log(`\n   [WARN] Detected corrupt node_modules in "${themeName}" (missing: ${integrity.missing}) — reinstalling.`);
        wipeDir(themeNodeModules);
        wipeDir(themeNextCache);
        wipeDir(path.join(themePath, 'package-lock.json'));
        execSync('npm install --prefer-offline --no-audit --no-fund', { cwd: themePath, stdio: 'inherit' });
    }

    // Always wipe the .next cache before starting. Turbopack's manifest can
    // get out of sync with node_modules after a reinstall and emit the same
    // "can't resolve" error. Cheap and safe to always flush.
    if (fs.existsSync(themeNextCache)) {
        wipeDir(themeNextCache);
    }

    const envLocal = path.join(themePath, '.env.local');
    const envExample = path.join(themePath, '.env.local.example');
    if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, envLocal);
        console.log(`   Created .env.local from .env.local.example`);
    }
}

function startTheme(themeName) {
    const themePath = path.join(THEMES_DIR, themeName);
    console.log(`\n🚀  Starting theme "${themeName}" on port 3002...\n`);
    return spawn('npm', ['run', 'dev'], {
        cwd: themePath,
        stdio: 'inherit',
        shell: true,
    });
}

function killProcess(child) {
    if (!child) return;
    if (process.platform === 'win32') {
        const { spawnSync } = require('child_process');
        spawnSync('taskkill', ['/pid', child.pid, '/f', '/t']);
    } else {
        child.kill('SIGTERM');
    }
}

async function main() {
    console.log(`\n🎨  Detecting active theme from ${API_URL}...`);

    const activeTheme = await waitForBackend();
    let currentTheme = resolveTheme(activeTheme);

    // Empty themes/ directory — nothing to boot. Keep the watcher alive
    // so the moment a theme is uploaded the script picks it up.
    if (!currentTheme) {
        console.log('\n   No themes installed in themes/.');
        console.log('   Upload or purchase one at http://localhost:3000/dashboard/themes');
        console.log('   (This process will start the theme server automatically when one appears.)\n');

        const scanInterval = setInterval(() => {
            const latest = resolveTheme(null);
            if (latest) {
                clearInterval(scanInterval);
                console.log(`\n✓  Theme detected: ${latest}`);
                prepareTheme(latest);
                const child = startTheme(latest);
                child.on('exit', code => process.exit(code ?? 0));
            }
        }, WATCH_INTERVAL_MS);

        process.on('SIGINT', () => { clearInterval(scanInterval); process.exit(0); });
        process.on('SIGTERM', () => { clearInterval(scanInterval); process.exit(0); });
        return;
    }

    if (activeTheme && themeExists(activeTheme)) {
        console.log(`\n✓  Active theme: ${currentTheme}`);
    } else {
        console.log(`\n   No active theme set — serving "${currentTheme}" as fallback.`);
        console.log(`   Activate a theme at http://localhost:3000/dashboard/themes\n`);
    }

    prepareTheme(currentTheme);
    let child = startTheme(currentTheme);
    let lastRestartCounter = await fetchRestartCounter();

    // Watch for theme changes — name change OR restart-counter bump.
    const watcher = setInterval(async () => {
        const latest = await fetchActiveTheme();
        if (latest === undefined) return; // Backend temporarily unreachable

        const resolved = resolveTheme(latest);
        const counter = await fetchRestartCounter();

        const themeChanged = resolved !== currentTheme;
        const restartRequested = counter > lastRestartCounter;

        if (!themeChanged && !restartRequested) return;

        if (themeChanged && latest) {
            console.log(`\n🔄  Active theme changed: "${currentTheme}" → "${resolved}"`);
        } else if (themeChanged) {
            console.log(`\n⚠  Theme deactivated. Switching to placeholder (${PLACEHOLDER_THEME})...`);
        } else {
            console.log(`\n🔄  Re-activation requested for "${currentTheme}" — restarting to pick up changes...`);
        }

        child.removeAllListeners('exit');
        killProcess(child);
        // 1.5s gives Windows time to release file handles on the
        // memory-mapped next-swc.node before prepareTheme tries to
        // wipe / reinstall.
        await sleep(1500);

        currentTheme = resolved;
        lastRestartCounter = counter;
        prepareTheme(currentTheme);
        child = startTheme(currentTheme);

        child.on('exit', code => {
            if (code !== null) { clearInterval(watcher); process.exit(code); }
        });
    }, WATCH_INTERVAL_MS);

    child.on('exit', code => {
        clearInterval(watcher);
        process.exit(code ?? 0);
    });

    const cleanup = () => {
        clearInterval(watcher);
        killProcess(child);
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
}

main().catch(err => {
    console.error('dev-theme error:', err.message);
    process.exit(1);
});
