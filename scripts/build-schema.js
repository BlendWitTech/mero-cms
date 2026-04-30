#!/usr/bin/env node
/**
 * build-schema.js (Bulletproof Version)
 * Assembles backend/prisma/schema.prisma from module files.
 */

const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..', 'backend');
const MODULES_DIR = path.resolve(BACKEND_ROOT, 'prisma', 'modules');
const OUTPUT_FILE = path.resolve(BACKEND_ROOT, 'prisma', 'schema.prisma');

const MODULE_SCHEMA_MAP = {
  blogs: ['blogs'],
  categories: ['blogs'],
  tags: ['blogs'],
  comments: ['blogs', 'comments'],
  menus: ['menus'],
  pages: ['pages'],
  seo: ['seo'],
  redirects: ['redirects'],
  sitemap: [],
  robots: ['robots'],
  analytics: ['analytics'],
  themes: ['themes'],
  leads: ['leads'],
  team: ['team'],
  testimonials: ['testimonials'],
  services: ['services'],
  demo: ['demo'],
  // forms, collections, webhooks are already in _core.prisma
  forms: [],
  collections: [],
  webhooks: [],
};

function buildSchema(keys) {
  const schemaFiles = new Set();
  keys.forEach(k => {
    if (MODULE_SCHEMA_MAP[k]) {
      MODULE_SCHEMA_MAP[k].forEach(f => schemaFiles.add(f));
    }
  });

  const parts = [];

  try {
    // 1. Core Blocks
    const datasourcePath = path.join(MODULES_DIR, '_datasource.prisma');
    const corePath = path.join(MODULES_DIR, '_core.prisma');

    parts.push(fs.readFileSync(datasourcePath, 'utf8').trimEnd());
    
    let coreContent = fs.readFileSync(corePath, 'utf8');
    if (!schemaFiles.has('blogs')) {
      coreContent = coreContent.replace(/[ \t]+posts\s+Post\[\]\s*\n/g, '');
    }
    if (!schemaFiles.has('comments')) {
      coreContent = coreContent.replace(/[ \t]+comments\s+Comment\[\]\s*\n/g, '');
    }
    parts.push(coreContent.trimEnd());

    // 2. Module Files
    const sorted = [...schemaFiles].sort();
    for (const file of sorted) {
      const fPath = path.join(MODULES_DIR, file + '.prisma');
      if (fs.existsSync(fPath)) {
        let content = fs.readFileSync(fPath, 'utf8');
        if (file === 'blogs' && !schemaFiles.has('comments')) {
          content = content.replace(/[ \t]+comments\s+Comment\[\]\s*\n/g, '');
        }
        parts.push(content.trimEnd());
      } else {
        console.warn(`[SKIP] Missing module file: ${file}.prisma`);
      }
    }

    const finalSchema = parts.join('\n\n') + '\n';
    fs.writeFileSync(OUTPUT_FILE, finalSchema, 'utf8');

    console.log(`[SUCCESS] Schema assembled (${sorted.length} modules)`);
    console.log(`[INFO] Enabled: ${sorted.join(', ')}`);
    console.log(`[INFO] Output: ${OUTPUT_FILE}`);
    process.exit(0);
  } catch (err) {
    console.error(`[ERROR] Schema assembly failed: ${err.message}`);
    process.exit(1);
  }
}

const arg = process.argv[2] || '';
const keys = arg === 'all' 
  ? Object.keys(MODULE_SCHEMA_MAP) 
  : arg.split(',').map(s => s.trim()).filter(Boolean);

buildSchema(keys);
