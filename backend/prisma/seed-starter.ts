/**
 * seed-starter.ts
 * Minimal seed for a fresh customer installation.
 * Creates core roles and CMS branding defaults.
 * Does NOT create any user — the setup wizard handles that.
 *
 * Run: npm run seed:starter
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starter Seed: Starting ---');

    // ── Roles ─────────────────────────────────────────────────────────────────
    await (prisma as any).role.upsert({
        where: { name: 'Super Admin' },
        update: { level: 0 },
        create: { name: 'Super Admin', level: 0, permissions: { all: true } },
    });

    await (prisma as any).role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin', level: 5,
            permissions: {
                content_view: true, content_create: true, content_edit: true, content_delete: true,
                media_view: true, media_upload: true, media_delete: true,
                users_view: true, users_create: true, users_edit: true,
                roles_view: true,
                settings_edit: true,
                leads_view: true,
                audit_view: true,
            },
        },
    });

    await (prisma as any).role.upsert({
        where: { name: 'Editor' },
        update: {},
        create: {
            name: 'Editor', level: 10,
            permissions: {
                content_view: true, content_create: true, content_edit: true,
                media_view: true, media_upload: true,
            },
        },
    });

    await (prisma as any).role.upsert({
        where: { name: 'Author' },
        update: {},
        create: {
            name: 'Author', level: 20,
            permissions: { content_view: true, content_create: true, media_view: true },
        },
    });

    console.log('Roles: OK');

    // ── CMS branding defaults (never overwrite if already set) ────────────────
    const defaults = [
        { key: 'cms_title',    value: 'Mero CMS' },
        { key: 'cms_subtitle', value: 'Elevate Your Content Strategy' },
    ];

    for (const s of defaults) {
        await (prisma as any).setting.upsert({
            where: { key: s.key },
            update: {},   // never overwrite
            create: s,
        });
    }

    console.log('Settings: OK');
    console.log('--- Starter Seed: Complete ---');
    console.log('Next: open the admin panel and complete the setup wizard to create your superadmin account.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
