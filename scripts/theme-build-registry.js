#!/usr/bin/env node
/**
 * theme-build-registry.js — generate a theme's widget-registry from
 * its theme.json so authors don't have to keep two source-of-truths
 * (the JSON catalog AND the TS import map) in sync by hand.
 *
 * Usage:
 *   node scripts/theme-build-registry.js mero-pro   # one theme
 *   node scripts/theme-build-registry.js --all            # every theme/
 *   node scripts/theme-build-registry.js mero-pro -o /custom/path.tsx
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');

const BUILTINS = new Set([
    'Hero', 'LogoStrip', 'FeatureBlocks', 'UseCases', 'Stats',
    'Carousel', 'VideoEmbed', 'Gallery', 'Accordion', 'Tabs',
    'Countdown', 'PricingTable', 'ComparisonTable',
    'PricingTeaser', 'Testimonials', 'FAQ', 'FinalCTA',
    'PageHero', 'RichContent', 'ListSection', 'ContactForm',
]);

const DEFAULT_ALIASES = {
    'hero': 'Hero',
    'logos': 'LogoStrip',
    'features': 'FeatureBlocks',
    'use-cases': 'UseCases',
    'usecases': 'UseCases',
    'stats': 'Stats',
    'pricing': 'PricingTeaser',
    'testimonials': 'Testimonials',
    'faq': 'FAQ',
    'cta': 'FinalCTA',
    'final-cta': 'FinalCTA',
    'page-hero': 'PageHero',
    'pagehero': 'PageHero',
    'rich-content': 'RichContent',
    'richcontent': 'RichContent',
    'list-section': 'ListSection',
    'list': 'ListSection',
    'contact-form': 'ContactForm',
    'form': 'ContactForm',
    'body': 'RichContent',
    'topics': 'ListSection',
    'releases': 'ListSection',
    'now': 'ListSection',
    'next': 'ListSection',
    'later': 'ListSection',
    'roles': 'ListSection',
    'values': 'ListSection',
    'cases': 'ListSection',
    'quotes': 'Testimonials',
    'options': 'ListSection',
    'practices': 'ListSection',
    'themes': 'ListSection',
    'featured': 'ListSection',
};

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

function generate(theme) {
    const widgets = Array.isArray(theme.widgetCatalog) ? theme.widgetCatalog : [];
    if (widgets.length === 0) {
        throw new Error(`theme "${theme.slug || theme.name}" has no widgetCatalog entries`);
    }

    const importsBySource = new Map();
    const registryEntries = [];
    const aliasMap        = { ...DEFAULT_ALIASES };

    for (const w of widgets) {
        if (!w || !w.type) continue;
        const type     = w.type;
        const compName = w.componentName || type;
        const source   = w.componentImport
            || (BUILTINS.has(type) ? '@/_shared' : `../components/sections/${type}`);

        const importBinding = compName === type ? type : `${compName} as ${type}`;
        if (!importsBySource.has(source)) importsBySource.set(source, new Set());
        importsBySource.get(source).add(importBinding);

        registryEntries.push({ type });

        if (Array.isArray(w.aliases)) {
            for (const a of w.aliases) {
                if (typeof a === 'string' && a) aliasMap[a.toLowerCase()] = type;
            }
        }
    }

    const sortedSources = [...importsBySource.keys()].sort((a, b) => {
        const aa = a.startsWith('@/_shared') ? 0 : 1;
        const bb = b.startsWith('@/_shared') ? 0 : 1;
        if (aa !== bb) return aa - bb;
        return a.localeCompare(b);
    });
    const importLines = sortedSources.map((src) => {
        const bindings = [...importsBySource.get(src)].sort();
        return `import { ${bindings.join(', ')} } from '${src}';`;
    });

    const registryLines = registryEntries
        .map((e) => `    ${e.type}: { component: ${e.type} as ComponentType<{ data?: any }> },`)
        .join('\n');

    const aliasLines = Object.keys(aliasMap).sort()
        .map((k) => `    '${k}': '${aliasMap[k]}',`)
        .join('\n');

    return `/**
 * AUTO-GENERATED - do not edit by hand.
 * Generated from theme.json widgetCatalog by
 *   node scripts/theme-build-registry.js ${theme.slug || ''}
 *
 * Theme:    ${theme.name || ''} (${theme.slug || ''})
 * Version:  ${theme.version || ''}
 * Widgets:  ${registryEntries.length}
 */

import type { ComponentType } from 'react';
import { renderPluginWidget } from '@/_shared';

${importLines.join('\n')}

type AnyData = Record<string, unknown>;

type WidgetEntry = {
    component: ComponentType<{ data?: any }>;
};

const REGISTRY: Record<string, WidgetEntry> = {
${registryLines}
};

const ID_TO_TYPE: Record<string, string> = {
${aliasLines}
};

export interface WidgetLike {
    id?: string;
    type?: string;
    enabled?: boolean;
    data?: AnyData;
    pluginSlug?: string | null;
}

function widgetKey(w: WidgetLike): string {
    const explicit = (w.type || '').trim();
    if (explicit) return explicit;
    const rawId = (w.id || '').trim();
    if (!rawId) return '';
    if (rawId in REGISTRY) return rawId;
    const mapped = ID_TO_TYPE[rawId.toLowerCase()];
    return mapped || rawId;
}

export function renderWidgets(widgets: WidgetLike[] | null | undefined) {
    if (!Array.isArray(widgets)) return null;
    return widgets
        .filter((w) => w?.enabled !== false)
        .map((w, i) => {
            const type = widgetKey(w);
            const key = w.id || \`\${type}-\${i}\`;
            // Plugin-contributed widget (Phase 6.2) — route through the
            // runtime plugin-widget renderer rather than the static map.
            if (w.pluginSlug) {
                return renderPluginWidget(w.pluginSlug, type, w.data, key);
            }
            const entry = REGISTRY[type];
            if (!entry) {
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn(\`[widget-registry] unknown widget type: "\${type}"\`);
                }
                return null;
            }
            const Component = entry.component;
            return <Component key={key} data={w.data as any} />;
        });
}

export function isKnownWidgetType(type: string): boolean {
    return type in REGISTRY;
}

export function knownWidgetTypes(): string[] {
    return Object.keys(REGISTRY);
}
`;
}

function buildOne(slug, opts) {
    opts = opts || {};
    const themeDir = path.join(THEMES_DIR, slug);
    const themeJsonPath = path.join(themeDir, 'theme.json');
    if (!fs.existsSync(themeJsonPath)) {
        throw new Error(`theme.json not found for "${slug}"`);
    }
    const theme = readJson(themeJsonPath);
    const code = generate(theme);

    const outPath = opts.outFile
        || path.join(themeDir, 'src', 'lib', 'widget-registry.gen.tsx');

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, code, 'utf8');
    return { slug: slug, outPath: outPath, widgets: theme.widgetCatalog.length };
}

function findAllSlugs() {
    if (!fs.existsSync(THEMES_DIR)) return [];
    return fs.readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
        .map((d) => d.name)
        .filter((s) => fs.existsSync(path.join(THEMES_DIR, s, 'theme.json')));
}

function main() {
    const argv = process.argv.slice(2);
    const all  = argv.includes('--all');
    const oIdx = argv.indexOf('-o');
    const outFile = oIdx >= 0 ? argv[oIdx + 1] : undefined;

    const targets = all
        ? findAllSlugs()
        : argv.filter((a) => !a.startsWith('-') && a !== outFile);

    if (targets.length === 0) {
        console.error('Usage: node scripts/theme-build-registry.js <slug> | --all  [-o <path>]');
        console.error('Available slugs: ' + findAllSlugs().join(', '));
        process.exit(1);
    }

    let failures = 0;
    for (const slug of targets) {
        try {
            const r = buildOne(slug, { outFile: outFile });
            const rel = path.relative(ROOT, r.outPath);
            console.log(`ok ${slug.padEnd(22)} ${r.widgets} widget(s) -> ${rel}`);
        } catch (e) {
            failures++;
            console.error(`x  ${slug.padEnd(22)} ${e.message}`);
        }
    }

    process.exit(failures ? 1 : 0);
}

main();
