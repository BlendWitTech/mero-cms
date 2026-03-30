/**
 * seed-demo.ts
 * Seeds the demo environment: roles, 3 demo user accounts, CMS settings,
 * and marks setup as complete so the setup wizard is skipped.
 *
 * Run: npm run seed:demo
 * All passwords: demo1234
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Demo Seed: Starting ---');

    // ── 1. Roles ──────────────────────────────────────────────────────────────
    const superAdmin = await (prisma as any).role.upsert({
        where: { name: 'Super Admin' },
        update: { level: 0 },
        create: { name: 'Super Admin', level: 0, permissions: { all: true } },
    });

    const adminRole = await (prisma as any).role.upsert({
        where: { name: 'Admin' },
        update: { level: 5 },
        create: {
            name: 'Admin',
            level: 5,
            permissions: {
                all: true,
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

    const editorRole = await (prisma as any).role.upsert({
        where: { name: 'Editor' },
        update: { level: 10 },
        create: {
            name: 'Editor',
            level: 10,
            permissions: {
                content_view: true, content_create: true, content_edit: true,
                media_view: true, media_upload: true,
            },
        },
    });

    const authorRole = await (prisma as any).role.upsert({
        where: { name: 'Author' },
        update: { level: 20 },
        create: {
            name: 'Author',
            level: 20,
            permissions: {
                content_view: true, content_create: true,
                media_view: true,
            },
        },
    });

    console.log('Roles: OK');

    // ── 2. Demo users (password: demo1234) ────────────────────────────────────
    const demoPass = await bcrypt.hash('demo1234', 12);

    const users = [
        { email: 'admin@demo.merocms.com',  name: 'Demo Admin',  roleId: adminRole.id },
        { email: 'editor@demo.merocms.com', name: 'Demo Editor', roleId: editorRole.id },
        { email: 'author@demo.merocms.com', name: 'Demo Author', roleId: authorRole.id },
    ];

    for (const u of users) {
        const existing = await (prisma as any).user.findUnique({ where: { email: u.email } });
        if (!existing) {
            await (prisma as any).user.create({
                data: { email: u.email, name: u.name, password: demoPass, roleId: u.roleId },
            });
            console.log(`  Created user: ${u.email}`);
        } else {
            // Reset password on every seed so it matches demo1234 after a reset
            await (prisma as any).user.update({
                where: { email: u.email },
                data: { password: demoPass, roleId: u.roleId },
            });
            console.log(`  Updated user: ${u.email}`);
        }
    }

    // ── 3. CMS settings ───────────────────────────────────────────────────────
    const settings = [
        { key: 'cms_title',       value: 'Mero CMS' },
        { key: 'cms_subtitle',    value: 'Elevate Your Content Strategy' },
        { key: 'setup_complete',  value: 'true' },
        { key: 'site_title',      value: 'Mero CMS Demo' },
        { key: 'site_tagline',    value: 'A powerful headless CMS for modern businesses' },
        // Set next reset 2 hours from now so the banner shows immediately
        { key: 'demo_next_reset', value: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
    ];

    for (const s of settings) {
        await (prisma as any).setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: s,
        });
    }

    console.log('Settings: OK');
    console.log('--- Demo Seed: Complete ---');
    console.log('Credentials: admin@demo.merocms.com / demo1234');
    console.log('Next: activate a theme with "Import demo content" to populate content.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
