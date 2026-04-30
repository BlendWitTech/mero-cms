#!/usr/bin/env node
/**
 * package-theme.js — Packages a CMS theme into a distributable ZIP.
 *
 * The resulting ZIP extracts directly to uploads/themes/<name>/ on the target
 * CMS, so files are placed at the ZIP root (no wrapping folder).
 *
 * Usage:
 *   node scripts/package-theme.js <theme-name> [options]
 *
 * Options:
 *   --output <dir>    Output directory (default: ./dist)
 *   --media all       Bundle ALL image/video files from backend/uploads/
 *   --media refs      Bundle only /uploads/ files referenced in theme source (default)
 *   --media none      Skip media entirely
 *
 * Examples:
 *   node scripts/package-theme.js my-theme
 *   node scripts/package-theme.js my-theme --media all
 *   node scripts/package-theme.js my-theme --media none --output ./releases
 */

const fs   = require('fs');
const path = require('path');

// ─── Resolve adm-zip from the monorepo root node_modules ─────────────────────
let AdmZip;
try {
    AdmZip = require('adm-zip');
} catch {
    // Fallback: try backend node_modules (adm-zip is a backend dep)
    AdmZip = require(path.join(__dirname, '..', 'backend', 'node_modules', 'adm-zip'));
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT       = path.join(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');
const UPLOADS_DIR = path.join(ROOT, 'backend', 'uploads');

// ─── Args ─────────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const themeName = args.find(a => !a.startsWith('-'));

if (!themeName) {
    console.error('Usage: node scripts/package-theme.js <theme-name> [--output <dir>] [--media all|refs|none]');
    process.exit(1);
}

const outputIdx = args.indexOf('--output');
const outputDir = outputIdx !== -1
    ? path.resolve(args[outputIdx + 1])
    : path.join(ROOT, 'dist');

const mediaIdx  = args.indexOf('--media');
const mediaMode = mediaIdx !== -1 ? (args[mediaIdx + 1] || 'refs') : 'refs';

if (!['all', 'refs', 'none'].includes(mediaMode)) {
    console.error(`Invalid --media value "${mediaMode}". Use: all | refs | none`);
    process.exit(1);
}

// ─── Exclusions ───────────────────────────────────────────────────────────────
const EXCLUDE_DIRS  = new Set(['node_modules', '.next', 'out', '.turbo', '.cache', '.git']);
const EXCLUDE_FILES = new Set(['next-env.d.ts', '.DS_Store', 'Thumbs.db', 'desktop.ini']);
const EXCLUDE_PATS  = [/^\.env(\.|$)/, /\.log$/, /\.tmp$/, /^npm-debug\.log/];

const MEDIA_EXTS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif',
    '.mp4', '.mov', '.webm', '.avi',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shouldExclude(relPath) {
    const parts = relPath.replace(/\\/g, '/').split('/');
    if (parts.some(p => EXCLUDE_DIRS.has(p))) return true;
    const filename = parts[parts.length - 1];
    if (EXCLUDE_FILES.has(filename))              return true;
    if (EXCLUDE_PATS.some(r => r.test(filename))) return true;
    return false;
}

/** Recursively walk a directory, returning { full, rel } pairs. */
function walkDir(dir, base) {
    base = base || dir;
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath  = path.relative(base, fullPath).replace(/\\/g, '/');
        if (shouldExclude(relPath)) continue;
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath, base));
        } else {
            results.push({ full: fullPath, rel: relPath });
        }
    }
    return results;
}

/**
 * Scan all text files in `dir` for /uploads/<filename> references.
 * Returns a Set of bare filenames (without the /uploads/ prefix).
 */
function scanMediaRefs(dir) {
    const refs = new Set();
    const scanFile = (filePath) => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            for (const m of content.matchAll(/\/uploads\/([^\s"'`,>\)\]]+)/g)) {
                const filename = m[1].split('?')[0].split('#')[0];
                if (MEDIA_EXTS.has(path.extname(filename).toLowerCase())) {
                    refs.add(filename);
                }
            }
        } catch { /* binary files or permission errors */ }
    };

    const walk = (d) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            if (EXCLUDE_DIRS.has(entry.name)) continue;
            const p = path.join(d, entry.name);
            if (entry.isDirectory()) walk(p);
            else scanFile(p);
        }
    };
    walk(dir);
    return refs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const themeDir = path.join(THEMES_DIR, themeName);
if (!fs.existsSync(themeDir)) {
    console.error(`\nTheme not found: ${themeDir}`);
    console.error(`Available themes: ${fs.readdirSync(THEMES_DIR).filter(d =>
        fs.statSync(path.join(THEMES_DIR, d)).isDirectory()).join(', ')}`);
    process.exit(1);
}

console.log(`\n  Packaging theme: ${themeName}`);
console.log(`  Source: ${themeDir}`);

// ── Step 1: Copy media from uploads → theme/media/ ───────────────────────────
const themeMediaDir = path.join(themeDir, 'media');
fs.mkdirSync(themeMediaDir, { recursive: true });

if (mediaMode !== 'none') {
    let candidates = [];

    if (mediaMode === 'all') {
        if (fs.existsSync(UPLOADS_DIR)) {
            candidates = fs.readdirSync(UPLOADS_DIR)
                .filter(f => {
                    const ext = path.extname(f).toLowerCase();
                    const p   = path.join(UPLOADS_DIR, f);
                    return MEDIA_EXTS.has(ext) && fs.statSync(p).isFile();
                });
        }
        console.log(`  Media (all): ${candidates.length} file(s) in uploads/`);
    } else {
        // refs: scan theme source files + theme.json for /uploads/<file>
        const refs = scanMediaRefs(themeDir);
        candidates = [...refs].filter(f => {
            return MEDIA_EXTS.has(path.extname(f).toLowerCase())
                && fs.existsSync(path.join(UPLOADS_DIR, f));
        });

        if (candidates.length === 0 && refs.size === 0) {
            console.log(`  Media (refs): no /uploads/ references found in theme source.`);
            console.log(`  Tip: use --media all to bundle all uploaded files.`);
        } else {
            console.log(`  Media (refs): ${refs.size} reference(s) found, ${candidates.length} file(s) resolved`);
        }
    }

    let copied = 0;
    for (const file of candidates) {
        const src  = path.join(UPLOADS_DIR, file);
        const dest = path.join(themeMediaDir, file);
        if (!fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
            copied++;
        }
    }
    if (copied > 0) console.log(`  Copied ${copied} new file(s) → theme/media/`);

} else {
    console.log(`  Media: skipped`);
}

// ── Step 2: Collect all theme files ──────────────────────────────────────────
const files = walkDir(themeDir);
console.log(`  Files to pack: ${files.length}`);

// ── Step 3: Build ZIP (files at root — no wrapping folder) ───────────────────
fs.mkdirSync(outputDir, { recursive: true });
const zipPath = path.join(outputDir, `${themeName}.zip`);

const zip = new AdmZip();
for (const { full, rel } of files) {
    const zipFolder = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : '';
    const fileName  = path.basename(rel);
    zip.addLocalFile(full, zipFolder, fileName);
}
zip.writeZip(zipPath);

const sizeKB = (fs.statSync(zipPath).size / 1024).toFixed(1);
const sizeMB = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);

console.log(`\n  Created: ${zipPath}`);
console.log(`  Size: ${sizeMB} MB (${sizeKB} KB) | Files: ${files.length}`);
console.log(`\n  To install on a fresh CMS:`);
console.log(`    1. Dashboard → Themes → Upload ZIP`);
console.log(`    2. Click "Install Modules" (rebuilds DB schema if needed)`);
console.log(`    3. Click "Setup" (installs npm dependencies)`);
console.log(`    4. Click "Activate" → enable "Import demo content"\n`);
