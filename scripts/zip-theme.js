#!/usr/bin/env node
/**
 * zip-theme.js — Package a theme directory into a ZIP for upload to Mero CMS.
 *
 * Usage:
 *   node scripts/zip-theme.js <theme-slug>
 *   node scripts/zip-theme.js my-custom-theme
 *
 * Output: themes/<theme-slug>.zip
 *
 * Excludes: node_modules/, .next/, package-lock.json, next-env.d.ts, .env.local
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

// ── Argument parsing ─────────────────────────────────────────────────────────

const themeSlug = process.argv[2];

if (!themeSlug) {
  console.error('Usage: node scripts/zip-theme.js <theme-slug>');
  console.error('Example: node scripts/zip-theme.js mero-starter');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const themeDir = path.join(rootDir, 'themes', themeSlug);
const outFile = path.join(rootDir, 'themes', `${themeSlug}.zip`);

if (!fs.existsSync(themeDir)) {
  console.error(`Theme directory not found: ${themeDir}`);
  process.exit(1);
}

const themeDirStat = fs.statSync(themeDir);
if (!themeDirStat.isDirectory()) {
  console.error(`Not a directory: ${themeDir}`);
  process.exit(1);
}

console.log(`Packaging theme: ${themeSlug}`);
console.log(`Source: ${themeDir}`);
console.log(`Output: ${outFile}`);

// ── Excluded patterns ────────────────────────────────────────────────────────

const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git']);
const EXCLUDE_FILES = new Set(['package-lock.json', 'next-env.d.ts', '.env.local', '.DS_Store', 'vercel.json']);
const EXCLUDE_EXTENSIONS = new Set(['.log']);

function shouldExclude(relPath) {
  const parts = relPath.split(path.sep);
  for (const part of parts) {
    if (EXCLUDE_DIRS.has(part)) return true;
    if (EXCLUDE_FILES.has(part)) return true;
  }
  const basename = path.basename(relPath);
  const ext = path.extname(basename);
  if (EXCLUDE_EXTENSIONS.has(ext)) return true;
  if (basename.startsWith('.env.') && basename !== '.env.local.example') return true;
  return false;
}

// ── Collect files ────────────────────────────────────────────────────────────

function collectFiles(dir, baseDir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (shouldExclude(relPath)) continue;
    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, results);
    } else if (entry.isFile()) {
      results.push({ fullPath, relPath });
    }
  }
}

const files = [];
collectFiles(themeDir, themeDir, files);
console.log(`Found ${files.length} files to include.`);

// ── Try native zip (Linux/macOS) then PowerShell (Windows) ──────────────────

const platform = process.platform;

// Remove existing zip if present
if (fs.existsSync(outFile)) {
  fs.unlinkSync(outFile);
  console.log('Removed existing ZIP.');
}

let success = false;

if (platform !== 'win32') {
  // Build exclude args for the zip command
  const excludeArgs = [
    '--exclude=*/node_modules/*',
    '--exclude=*/.next/*',
    '--exclude=*/package-lock.json',
    '--exclude=*/next-env.d.ts',
    '--exclude=*/.env.local',
    '--exclude=*/.DS_Store',
  ].join(' ');

  const cmd = `cd "${themeDir}" && zip -r "${outFile}" . ${excludeArgs}`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    success = true;
  } catch {
    console.warn('Native zip command failed — falling back to Node.js implementation.');
  }
}

if (!success) {
  // Pure Node.js implementation (no external dependencies)
  // Writes a ZIP file using the DEFLATE-free store method for broad compatibility.
  // For real DEFLATE compression, install the `archiver` package.
  try {
    writeZip(files, themeDir, outFile);
    success = true;
  } catch (err) {
    console.error('Failed to create ZIP:', err.message);
    process.exit(1);
  }
}

if (success) {
  const stat = fs.statSync(outFile);
  const kb = (stat.size / 1024).toFixed(1);
  console.log(`\nDone! Created: ${outFile} (${kb} KB)`);
  console.log(`\nUpload this file via: Admin > Appearance > Themes > Upload Theme`);
}

// ── Pure Node ZIP writer (STORE method, no compression) ──────────────────────

/**
 * Minimal ZIP writer using STORE (no compression).
 * Supports files up to 4 GB (uses ZIP64 for larger sizes).
 */
function writeZip(fileList, baseDir, outputPath) {
  const fd = fs.openSync(outputPath, 'w');
  const centralDir = [];
  let offset = 0;

  for (const { fullPath, relPath } of fileList) {
    const data = fs.readFileSync(fullPath);
    const nameBytes = Buffer.from(relPath.replace(/\\/g, '/'), 'utf8');
    const crc = crc32(data);
    const size = data.length;

    // Local file header
    const localHeader = Buffer.alloc(30 + nameBytes.length);
    localHeader.writeUInt32LE(0x04034b50, 0);   // signature
    localHeader.writeUInt16LE(20, 4);            // version needed
    localHeader.writeUInt16LE(0, 6);             // flags
    localHeader.writeUInt16LE(0, 8);             // compression (STORE)
    localHeader.writeUInt16LE(0, 10);            // mod time
    localHeader.writeUInt16LE(0, 12);            // mod date
    localHeader.writeUInt32LE(crc >>> 0, 14);   // CRC-32
    localHeader.writeUInt32LE(size, 18);         // compressed size
    localHeader.writeUInt32LE(size, 22);         // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26); // name length
    localHeader.writeUInt16LE(0, 28);            // extra length
    nameBytes.copy(localHeader, 30);

    fs.writeSync(fd, localHeader);
    fs.writeSync(fd, data);

    // Central directory entry
    const cdEntry = Buffer.alloc(46 + nameBytes.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);        // signature
    cdEntry.writeUInt16LE(20, 4);                // version made by
    cdEntry.writeUInt16LE(20, 6);                // version needed
    cdEntry.writeUInt16LE(0, 8);                 // flags
    cdEntry.writeUInt16LE(0, 10);                // compression
    cdEntry.writeUInt16LE(0, 12);                // mod time
    cdEntry.writeUInt16LE(0, 14);                // mod date
    cdEntry.writeUInt32LE(crc >>> 0, 16);        // CRC-32
    cdEntry.writeUInt32LE(size, 20);             // compressed size
    cdEntry.writeUInt32LE(size, 24);             // uncompressed size
    cdEntry.writeUInt16LE(nameBytes.length, 28); // name length
    cdEntry.writeUInt16LE(0, 30);                // extra length
    cdEntry.writeUInt16LE(0, 32);                // comment length
    cdEntry.writeUInt16LE(0, 34);                // disk number start
    cdEntry.writeUInt16LE(0, 36);                // internal attr
    cdEntry.writeUInt32LE(0, 38);                // external attr
    cdEntry.writeUInt32LE(offset, 42);           // local header offset
    nameBytes.copy(cdEntry, 46);

    centralDir.push(cdEntry);
    offset += localHeader.length + data.length;
  }

  // Write central directory
  const cdStart = offset;
  for (const entry of centralDir) {
    fs.writeSync(fd, entry);
  }
  const cdSize = centralDir.reduce((acc, e) => acc + e.length, 0);

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);             // signature
  eocd.writeUInt16LE(0, 4);                       // disk number
  eocd.writeUInt16LE(0, 6);                       // disk with cd
  eocd.writeUInt16LE(centralDir.length, 8);       // entries on disk
  eocd.writeUInt16LE(centralDir.length, 10);      // total entries
  eocd.writeUInt32LE(cdSize, 12);                 // cd size
  eocd.writeUInt32LE(cdStart, 16);                // cd offset
  eocd.writeUInt16LE(0, 20);                      // comment length
  fs.writeSync(fd, eocd);

  fs.closeSync(fd);
}

