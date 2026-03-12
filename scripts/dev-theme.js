#!/usr/bin/env node
/**
 * dev-theme.js
 *
 * Reads the active theme from the CMS backend and starts it on port 3002.
 * Watches for active theme changes every 4s and hot-swaps to the new theme
 * automatically — no manual restart needed.
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
const DEFAULT_THEME = 'mero-cms-marketing';
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
        // Unreachable
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

function getAvailableThemes() {
    if (!fs.existsSync(THEMES_DIR)) return [];
    return fs.readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
        .map(d => d.name);
}

function resolveTheme(name) {
    if (name && fs.existsSync(path.join(THEMES_DIR, name))) return name;
    const available = getAvailableThemes();
    return available[0] || DEFAULT_THEME;
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

    const child = spawn('npm', ['run', 'dev'], {
        cwd: themePath,
        stdio: 'inherit',
        shell: true,
    });

    return child;
}

async function main() {
    console.log(`\n🎨  Detecting active theme from ${API_URL}...`);

    // Wait for backend on startup
    let activeTheme = await waitForBackend();

    let currentTheme = resolveTheme(activeTheme);
    if (activeTheme) {
        console.log(`\n✓  Active theme: ${currentTheme}`);
    } else {
        console.log(`\n   No active theme set (or backend unreachable). Using: ${currentTheme}`);
    }

    prepareTheme(currentTheme);
    let child = startTheme(currentTheme);

    // Watch for theme changes while the dev server is running
    const watcher = setInterval(async () => {
        const latest = await fetchActiveTheme();
        if (!latest) return; // Backend temporarily unreachable — ignore
        const resolved = resolveTheme(latest);
        if (resolved === currentTheme) return; // No change

        console.log(`\n🔄  Active theme changed: "${currentTheme}" → "${resolved}"`);
        console.log(`    Stopping current theme server...`);

        // Kill old child and start the new theme
        child.removeAllListeners('exit');
        if (process.platform === 'win32') {
            const { spawnSync } = require('child_process');
            spawnSync('taskkill', ['/pid', child.pid, '/f', '/t']);
        } else {
            child.kill('SIGTERM');
        }

        await sleep(1500); // Give the process time to shut down

        currentTheme = resolved;
        prepareTheme(currentTheme);
        child = startTheme(currentTheme);

        child.on('exit', code => {
            // Only exit if watcher isn't about to swap again
            if (code !== null) {
                clearInterval(watcher);
                process.exit(code);
            }
        });
    }, WATCH_INTERVAL_MS);

    // Initial exit handler
    child.on('exit', code => {
        clearInterval(watcher);
        process.exit(code ?? 0);
    });

    const killChild = (sig) => {
        if (process.platform === 'win32') {
            const { spawnSync } = require('child_process');
            spawnSync('taskkill', ['/pid', child.pid, '/f', '/t']);
        } else {
            child.kill(sig);
        }
    };

    process.on('SIGINT', () => { clearInterval(watcher); killChild('SIGINT'); });
    process.on('SIGTERM', () => { clearInterval(watcher); killChild('SIGTERM'); });
}

main().catch(err => {
    console.error('dev-theme error:', err.message);
    process.exit(1);
});
