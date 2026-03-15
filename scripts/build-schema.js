#!/usr/bin/env node
/**
 * build-schema.js
 * Assembles backend/prisma/schema.prisma from module files.
 *
 * Usage:
 *   node scripts/build-schema.js blogs,projects,team
 *   node scripts/build-schema.js  (core only — for fresh installs)
 */

const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.join(__dirname, '..', 'backend');
const MODULES_DIR = path.join(BACKEND_ROOT, 'prisma', 'modules');
const OUTPUT_FILE = path.join(BACKEND_ROOT, 'prisma', 'schema.prisma');

/**
 * Maps CMS module key → which .prisma files are required.
 * Categories/Tags are bundled in blogs.prisma (Category/Tag tables live there).
 * Comments depends on blogs (Comment.post FK → Post).
 * PlotCategories is bundled in plots.prisma.
 * Sitemap has no DB tables.
 */
const MODULE_SCHEMA_MAP = {
  blogs: ['blogs'],
  categories: ['blogs'],
  tags: ['blogs'],
  comments: ['blogs', 'comments'],
  plots: ['plots'],
  'plot-categories': ['plots'],
  team: ['team'],
  services: ['services'],
  testimonials: ['testimonials'],
  menus: ['menus'],
  pages: ['pages'],
  leads: ['leads'],
  seo: ['seo'],
  redirects: ['redirects'],
  sitemap: [],          // no DB tables needed
  robots: ['robots'],
  analytics: ['analytics'],
  themes: ['themes'],
};

function buildSchema(enabledModules) {
  // Resolve which .prisma module files to include (deduplicated)
  const schemaFiles = new Set();
  for (const mod of enabledModules) {
    const files = MODULE_SCHEMA_MAP[mod];
    if (files === undefined) {
      console.warn(`Warning: Unknown module "${mod}" — skipping`);
      continue;
    }
    files.forEach(f => schemaFiles.add(f));
  }

  const parts = [];

  // 1. Always include datasource + generator block
  parts.push(fs.readFileSync(path.join(MODULES_DIR, '_datasource.prisma'), 'utf8').trimEnd());

  // 2. Always include core models (User, Role, Setting, etc.) with conditional patching
  let coreContent = fs.readFileSync(path.join(MODULES_DIR, '_core.prisma'), 'utf8');

  // Remove User.posts Post[] backlink if blogs module is not included
  if (!schemaFiles.has('blogs')) {
    coreContent = coreContent.replace(/[ \t]+posts\s+Post\[\]\s*\n/, '');
  }
  // Remove User.comments Comment[] backlink if comments module is not included
  if (!schemaFiles.has('comments')) {
    coreContent = coreContent.replace(/[ \t]+comments\s+Comment\[\]\s*\n/, '');
  }

  parts.push(coreContent.trimEnd());

  // 3. Include selected module files in alphabetical order (deterministic output)
  const sortedFiles = [...schemaFiles].sort();

  for (const file of sortedFiles) {
    const filePath = path.join(MODULES_DIR, `${file}.prisma`);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Schema file not found: ${file}.prisma — skipping`);
      continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');

    // Patch blogs.prisma: remove Post.comments Comment[] if comments module not included
    if (file === 'blogs' && !schemaFiles.has('comments')) {
      content = content.replace(/[ \t]+comments\s+Comment\[\]\s*\n/, '');
    }

    parts.push(content.trimEnd());
  }

  const schema = parts.join('\n\n') + '\n';
  fs.writeFileSync(OUTPUT_FILE, schema, 'utf8');

  console.log(`✓ Schema assembled`);
  console.log(`  Enabled schemas: ${sortedFiles.length > 0 ? sortedFiles.join(', ') : '(core only)'}`);
  console.log(`  Output: ${OUTPUT_FILE}`);
}

// Parse CLI argument: comma-separated list of module keys
const arg = process.argv[2] || '';
let enabledModules;

if (arg === 'all') {
  enabledModules = Object.keys(MODULE_SCHEMA_MAP);
} else {
  enabledModules = arg ? arg.split(',').map(s => s.trim()).filter(Boolean) : [];
}

buildSchema(enabledModules);
