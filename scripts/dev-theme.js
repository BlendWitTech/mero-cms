#!/usr/bin/env node
/**
 * dev-theme.js
 *
 * Reads the active theme from the CMS backend and starts it on port 3002.
 * When no theme is active, starts mero-starter-theme which shows a "No Theme
 * Active" placeholder page.
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
const PLACEHOLDER_THEME = 'mero-starter-theme';
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

/** Returns the theme to start: the active theme if it exists, otherwise the placeholder. */
function resolveTheme(activeTheme) {
    if (themeExists(activeTheme)) return activeTheme;
    if (fs.existsSync(path.join(THEMES_DIR, PLACEHOLDER_THEME))) return PLACEHOLDER_THEME;
    // Last resort: any available theme
    const dirs = fs.readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
        .map(d => d.name);
    return dirs[0] || PLACEHOLDER_THEME;
}

function prepareTheme(themeName) {
    const themePath = path.join(THEMES_DIR, themeName);
    if (!fs.existsSync(path.join(themePath, 'node_modules'))) {
        console.log(`\n   Installing dependencies for "${themeName}"...`);
        execSync('npm install', { cwd: themePath, stdio: 'inherit' });
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

    if (activeTheme && themeExists(activeTheme)) {
        console.log(`\n✓  Active theme: ${currentTheme}`);
    } else {
        console.log(`\n   No active theme set — showing placeholder (${PLACEHOLDER_THEME}).`);
        console.log(`   Activate a theme at http://localhost:3000/dashboard/themes\n`);
    }

    prepareTheme(currentTheme);
    let child = startTheme(currentTheme);

    // Watch for theme changes
    const watcher = setInterval(async () => {
        const latest = await fetchActiveTheme();
        if (latest === undefined) return; // Backend temporarily unreachable

        const resolved = resolveTheme(latest);
        if (resolved === currentTheme) return; // No change

        if (latest) {
            console.log(`\n🔄  Active theme changed: "${currentTheme}" → "${resolved}"`);
        } else {
            console.log(`\n⚠  Theme deactivated. Switching to placeholder (${PLACEHOLDER_THEME})...`);
        }

        child.removeAllListeners('exit');
        killProcess(child);
        await sleep(1500);

        currentTheme = resolved;
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
