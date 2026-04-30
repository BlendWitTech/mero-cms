#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');

const KNOWN_PACKAGES = new Set([
    'personal-basic', 'personal-premium', 'personal-professional', 'personal-custom',
    'org-basic', 'org-premium', 'org-enterprise', 'org-custom', 'any',
]);
const KNOWN_ICONS = new Set([
    'Sparkles','Heading1','FileText','List','Building2','BarChart3','Megaphone',
    'LayoutGrid','Compass','DollarSign','Quote','HelpCircle','Mail','Square','Layers3',
    'GalleryHorizontal','Play','Images','ChevronsUpDown','PanelTop','Timer','Receipt','Table',
]);
const KNOWN_CAPABILITIES = new Set([
    'pluginMarketplace','themeCodeEdit','visualThemeEditor','proWidgets',
    'dashboardBranding','webhooks','collections','forms',
    'analytics','auditLog','siteEditor','seoFull',
    'aiContent','apiAccess','whiteLabel',
]);
const KNOWN_FIELD_TYPES = new Set([
    'text','string','textarea','image','media','number',
    'button','buttons','stats','select','json','managed',
    'color','slider','range','font','repeater','richtext',
]);
const KNOWN_BUNDLE_TIERS = new Set([
    'basic','premium','professional','enterprise','custom','any',
]);

function readJsonSafe(filePath) {
    try {
        const text = fs.readFileSync(filePath,'utf8').replace(/^﻿/,'');
        return [null, JSON.parse(text)];
    } catch (e) {
        return [`could not read or parse ${filePath}: ${e.message}`, null];
    }
}

function validate(t) {
    const errors=[]; const warnings=[];
    const push = (lvl,msg) => (lvl==='error'?errors:warnings).push(msg);

    for (const k of ['name','slug','version']) if (!t[k]) push('error',`missing required field: ${k}`);

    if (t.minPackageTier!==undefined) {
        const v=t.minPackageTier;
        if (typeof v!=='number'||v<1||v>4) push('error',`minPackageTier must be 1..4, got ${JSON.stringify(v)}`);
    }
    if (t.supportedPackages!==undefined) {
        if (!Array.isArray(t.supportedPackages)||t.supportedPackages.length===0) push('error','supportedPackages must be a non-empty array');
        else for (const p of t.supportedPackages) if (!KNOWN_PACKAGES.has(p)) push('error',`supportedPackages: unknown package id "${p}"`);
    }

    const widgetTypes=new Set();
    if (Array.isArray(t.widgetCatalog)) {
        for (const [i,w] of t.widgetCatalog.entries()) {
            const ctx=`widgetCatalog[${i}]`;
            if (!w||typeof w!=='object') { push('error',`${ctx}: must be an object`); continue; }
            if (!w.type) push('error',`${ctx}: missing "type"`);
            if (!w.name) push('error',`${ctx}: missing "name"`);
            if (w.icon && !KNOWN_ICONS.has(w.icon)) push('warning',`${ctx}: icon "${w.icon}" not in curated set (Lucide resolves any name at runtime).`);
            if (!w.category) push('warning',`${ctx}: missing "category"`);
            if (w.type) widgetTypes.add(w.type);
        }
    }

    const schemaTypes=new Set();
    if (t.moduleSchemas && typeof t.moduleSchemas==='object') {
        for (const [type,fields] of Object.entries(t.moduleSchemas)) {
            schemaTypes.add(type);
            if (!Array.isArray(fields)) { push('error',`moduleSchemas.${type}: fields must be an array`); continue; }
            for (const [i,f] of fields.entries()) {
                const ctx=`moduleSchemas.${type}[${i}]`;
                if (!f||typeof f!=='object') { push('error',`${ctx}: must be an object`); continue; }
                if (!f.key)  push('error',`${ctx}: missing "key"`);
                if (!f.type) push('error',`${ctx}: missing "type"`);
                if (!f.label) push('warning',`${ctx}: missing "label"`);
                if (f.type && !KNOWN_FIELD_TYPES.has(f.type)) push('error',`${ctx}: unknown field type "${f.type}"`);
            }
        }
    }

    function validatePages(pages, ctx) {
        const seen=new Set();
        for (const [pi,page] of pages.entries()) {
            const pCtx=`${ctx}[${pi}]`;
            if (!page.slug) push('error',`${pCtx}: missing "slug"`);
            else if (seen.has(page.slug)) push('error',`${pCtx}: duplicate slug "${page.slug}"`);
            else seen.add(page.slug);
            if (!Array.isArray(page.sections)) { push('error',`${pCtx}: "sections" must be an array`); continue; }
            for (const [si,sec] of page.sections.entries()) {
                const sCtx=`${pCtx}.sections[${si}]`;
                if (!sec.id) push('error',`${sCtx}: missing "id"`);
                const tt = sec.type || sec.id;
                if (tt && !schemaTypes.has(tt) && !widgetTypes.has(tt)) {
                    push('error',`${sCtx}: type "${tt}" not declared in moduleSchemas or widgetCatalog`);
                }
            }
        }
    }
    if (Array.isArray(t.pageSchema)) validatePages(t.pageSchema,'pageSchema');

    if (t.bundle !== undefined) {
        const b=t.bundle;
        if (!b||typeof b!=='object') push('error','bundle must be an object');
        else if (!Array.isArray(b.designs)||b.designs.length===0) push('error','bundle.designs must be a non-empty array');
        else {
            const keys=new Set();
            for (const [i,d] of b.designs.entries()) {
                const ctx=`bundle.designs[${i}]`;
                if (!d||typeof d!=='object') { push('error',`${ctx}: must be an object`); continue; }
                if (!d.key) push('error',`${ctx}: missing "key"`);
                else if (keys.has(d.key)) push('error',`${ctx}: duplicate key "${d.key}"`);
                else keys.add(d.key);
                if (!d.name) push('warning',`${ctx}: missing "name"`);
                if (Array.isArray(d.bundleAccess)) {
                    for (const tier of d.bundleAccess) if (!KNOWN_BUNDLE_TIERS.has(tier)) push('error',`${ctx}.bundleAccess: unknown tier "${tier}"`);
                } else push('warning',`${ctx}: missing "bundleAccess" — visible to all tiers`);
                if (Array.isArray(d.pages) && d.pages.length) validatePages(d.pages, `${ctx}.pages`);
            }
            if (b.activeDesign && !keys.has(b.activeDesign)) push('error',`bundle.activeDesign "${b.activeDesign}" not found. Available: ${[...keys].join(', ')}`);
        }
    }

    const pageSlugs = new Set((t.pageSchema||[]).map(p=>p.slug));
    if (t.seedData && Array.isArray(t.seedData.pages)) {
        for (const [i,p] of t.seedData.pages.entries()) {
            if (p.slug && pageSlugs.size && !pageSlugs.has(p.slug)) push('warning',`seedData.pages[${i}]: slug "${p.slug}" doesn't match any pageSchema entry`);
        }
    }

    for (const k of ['requiredCapabilities','optionalCapabilities']) {
        if (Array.isArray(t[k])) for (const c of t[k]) if (!KNOWN_CAPABILITIES.has(c)) push('warning',`${k}: unknown capability "${c}"`);
    }
    return { errors, warnings };
}

function findThemeJson(target) {
    if (target.endsWith('theme.json') && fs.existsSync(target)) return [target];
    const c=path.join(THEMES_DIR,target,'theme.json');
    if (fs.existsSync(c)) return [c];
    return null;
}
function findAllThemes() {
    if (!fs.existsSync(THEMES_DIR)) return [];
    return fs.readdirSync(THEMES_DIR,{withFileTypes:true})
        .filter(d=>d.isDirectory()&&!d.name.startsWith('_')&&!d.name.startsWith('.'))
        .map(d=>path.join(THEMES_DIR,d.name,'theme.json'))
        .filter(p=>fs.existsSync(p));
}
function pad(s,w){return (s+' '.repeat(w)).slice(0,w);}

function main() {
    const target=process.argv[2];
    const targets = target ? findThemeJson(target) : findAllThemes();
    if (!targets || targets.length===0) {
        console.error(target?`Could not find theme.json for "${target}".`:`No themes found in ${THEMES_DIR}.`);
        process.exit(1);
    }
    let totalE=0, totalW=0;
    for (const f of targets) {
        const themeName=path.basename(path.dirname(f));
        const [err,t] = readJsonSafe(f);
        if (err) { console.error(`x ${themeName}: ${err}`); totalE++; continue; }
        const { errors, warnings } = validate(t);
        if (errors.length===0 && warnings.length===0) { console.log(`ok ${pad(themeName,22)} clean`); continue; }
        totalE += errors.length; totalW += warnings.length;
        const status = errors.length ? 'X ' : '! ';
        console.log(`${status}${pad(themeName,22)} ${errors.length} error(s), ${warnings.length} warning(s)`);
        for (const e of errors) console.log(`     ERROR    ${e}`);
        for (const w of warnings) console.log(`     WARN     ${w}`);
    }
    console.log('');
    if (totalE===0) { console.log(`All themes pass validation. (${totalW} warning(s) - non-blocking.)`); process.exit(0); }
    console.error(`${totalE} error(s) across ${targets.length} theme(s). Fix and re-run.`);
    process.exit(1);
}
main();
