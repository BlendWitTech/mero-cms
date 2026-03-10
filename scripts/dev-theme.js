#!/usr/bin/env node
/**
 * dev-theme.js
 *
 * Reads the active theme from the CMS backend (GET /public/site-data)
 * and starts it on port 3002.
 *
 * - Waits up to 15s for the backend to become available
 * - Falls back to the first available theme if backend is unreachable
 * - Installs node_modules automatically if missing
 *
 * Usage:
 *   node scripts/dev-theme.js
 *   npm run dev:theme   (calls this script)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_URL = process.env.CMS_API_URL || 'http://localhost:3001';
const THEMES_DIR = path.join(__dirname, '..', 'themes');
const DEFAULT_THEME = 'mero-cms-marketing';
const MAX_WAIT_MS = 15000;
const POLL_INTERVAL_MS = 1000;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function getActiveThemeFromBackend() {
    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_MS) {
        try {
            const res = await fetch(`${API_URL}/public/site-data`, {
                signal: AbortSignal.timeout(2000),
            });
            if (res.ok) {
                const data = await res.json();
                return data?.settings?.activeTheme || null;
            }
        } catch {
            // Backend not ready yet — keep polling
        }
        process.stdout.write('.');
        await sleep(POLL_INTERVAL_MS);
    }
    return null;
}

function getAvailableThemes() {
    if (!fs.existsSync(THEMES_DIR)) return [];
    return fs.readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
        .map(d => d.name);
}

async function main() {
    console.log(`\n🎨  Detecting active theme from ${API_URL}...`);

    const activeTheme = await getActiveThemeFromBackend();

    let themeName;
    if (activeTheme) {
        console.log(`\n✓  Active theme: ${activeTheme}`);
        themeName = activeTheme;
    } else {
        const available = getAvailableThemes();
        themeName = available.length > 0 ? available[0] : DEFAULT_THEME;
        console.log(`\n   No active theme set (or backend unreachable). Using: ${themeName}`);
    }

    const themePath = path.join(THEMES_DIR, themeName);

    if (!fs.existsSync(themePath)) {
        const available = getAvailableThemes();
        if (available.length === 0) {
            console.error(`✗  No themes found in ${THEMES_DIR}`);
            process.exit(1);
        }
        themeName = available[0];
        console.log(`   Theme directory not found. Falling back to: ${themeName}`);
    }

    const themeFullPath = path.join(THEMES_DIR, themeName);

    // Auto-install if node_modules is missing
    if (!fs.existsSync(path.join(themeFullPath, 'node_modules'))) {
        console.log(`   Installing dependencies for "${themeName}"...`);
        execSync('npm install', { cwd: themeFullPath, stdio: 'inherit' });
    }

    // Create .env.local if missing
    const envLocalPath = path.join(themeFullPath, '.env.local');
    const envExamplePath = path.join(themeFullPath, '.env.local.example');
    if (!fs.existsSync(envLocalPath) && fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envLocalPath);
        console.log(`   Created .env.local from .env.local.example`);
    }

    console.log(`🚀  Starting theme "${themeName}" on port 3002...\n`);

    const child = spawn('npm', ['run', 'dev'], {
        cwd: themeFullPath,
        stdio: 'inherit',
        shell: true,
    });

    child.on('exit', code => process.exit(code ?? 0));
    process.on('SIGINT', () => child.kill('SIGINT'));
    process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main().catch(err => {
    console.error('dev-theme error:', err.message);
    process.exit(1);
});
