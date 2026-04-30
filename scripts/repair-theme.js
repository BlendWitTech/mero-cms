#!/usr/bin/env node
/**
 * repair-theme.js
 *
 * One-shot recovery for a broken theme node_modules. The
 * @swc/helpers error keeps coming back on Windows when:
 *
 *   1. The theme dev server holds next-swc.win32-x64-msvc.node
 *      memory-mapped.
 *   2. Some other code (the activate flow, an interrupted install, a
 *      crashed npm) tries to wipe node_modules, fails halfway because
 *      Windows refuses to unlink the .node binary, and leaves the
 *      tree in a worse state than it found.
 *
 * This script is the deterministic way out: kill every node process
 * that could be holding files, wait for Windows to release locks,
 * then wipe + reinstall in peace.
 *
 * Usage:
 *   node scripts/repair-theme.js                     # repairs every theme under themes/
 *   node scripts/repair-theme.js mero-pro      # repairs one theme by slug
 *
 * Run it from a terminal that is NOT inside `dev:all`. The script
 * will kill the dev:all child processes itself.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'themes');

function killAllNode() {
    if (process.platform === 'win32') {
        // Best-effort kill. /F = force, /IM = image name. We don't care
        // about the exit code — if there's nothing to kill, that's fine.
        spawnSync('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
    } else {
        spawnSync('pkill', ['-f', 'node'], { stdio: 'ignore' });
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function rimraf(p) {
    if (!fs.existsSync(p)) return;
    try {
        fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
        return true;
    } catch (e) {
        console.error(`   [rimraf] failed: ${e.message}`);
        return false;
    }
}

async function repair(themeName) {
    const themePath = path.join(THEMES_DIR, themeName);
    if (!fs.existsSync(themePath)) {
        console.log(`   [skip] ${themeName} — directory not found`);
        return false;
    }

    console.log(`\n🔧  Repairing theme: ${themeName}`);
    console.log(`   Path: ${themePath}`);

    const nodeModules = path.join(themePath, 'node_modules');
    const nextCache  = path.join(themePath, '.next');
    const lockfile   = path.join(themePath, 'package-lock.json');

    // 1. Wipe.
    console.log('   1/4  Wiping node_modules / .next / package-lock.json');
    rimraf(nodeModules);
    rimraf(nextCache);
    if (fs.existsSync(lockfile)) {
        try { fs.unlinkSync(lockfile); } catch { /* keep going */ }
    }

    // 2. Re-verify the wipe succeeded. If node_modules still exists,
    //    Windows held a lock on something inside — abort with a clear
    //    instruction to reboot.
    if (fs.existsSync(nodeModules)) {
        console.error(
            `\n❌  Could not wipe node_modules at ${nodeModules}.\n` +
            `   Windows is holding a file lock on a child binary.\n` +
            `   Reboot Windows (releases all kernel-level locks), then re-run this script.\n`,
        );
        return false;
    }

    // 3. Reinstall.
    console.log('   2/4  Running npm install (~60s)...');
    try {
        execSync('npm install --no-fund --no-audit --prefer-offline', {
            cwd: themePath,
            stdio: 'inherit',
        });
    } catch (e) {
        console.error(`\n❌  npm install failed: ${e.message}`);
        return false;
    }

    // 4. Verify the canary file. If missing, the install didn't take.
    console.log('   3/4  Verifying integrity...');
    const canary = path.join(nodeModules, '@swc', 'helpers', 'package.json');
    if (!fs.existsSync(canary)) {
        console.error(
            `\n❌  Install completed but @swc/helpers is still missing.\n` +
            `   This usually means npm couldn't extract a tarball.\n` +
            `   Check your network, free disk space, and try again.\n`,
        );
        return false;
    }

    console.log('   4/4  Done. Theme is ready.');
    return true;
}

async function main() {
    const target = process.argv[2];
    if (!fs.existsSync(THEMES_DIR)) {
        console.error(`themes/ directory not found at ${THEMES_DIR}`);
        process.exit(1);
    }

    console.log('💀  Killing every node process to release file locks...');
    killAllNode();
    console.log('   Sleeping 3s for Windows to release file handles...');
    await sleep(3000);

    let themes;
    if (target) {
        themes = [target];
    } else {
        themes = fs.readdirSync(THEMES_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
            .map(d => d.name);
    }

    let allOk = true;
    for (const theme of themes) {
        const ok = await repair(theme);
        if (!ok) allOk = false;
    }

    if (allOk) {
        console.log('\n✓  All themes repaired. Run `npm run dev:all` to start.');
    } else {
        console.log('\n⚠  One or more themes failed. See errors above.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
