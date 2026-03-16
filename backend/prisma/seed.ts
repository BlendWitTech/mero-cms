import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Database ---');

    // 1. Create Roles
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'Super Admin' },
        update: {},
        create: {
            name: 'Super Admin',
            permissions: { all: true },
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            permissions: { manage_content: true, manage_media: true },
        },
    });

    console.log('Roles created/verified.');

    // 2. Create Super Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@blendwit.com' },
        update: {},
        create: {
            email: 'superadmin@blendwit.com',
            password: hashedPassword,
            name: 'Super Admin',
            forcePasswordChange: true,
            roleId: superAdminRole.id,
        },
    });

    console.log('Super Admin user created (email: superadmin@blendwit.com, password: admin123).');

    // 3. Initialize Default Settings
    const defaultSettings = [
        { key: 'site_title', value: 'Blendwit CMS' },
        { key: 'site_tagline', value: 'The modular CMS that adapts to every project' },
        { key: 'cms_title', value: 'Blendwit CMS' },
        { key: 'cms_subtitle', value: 'Elevate Your Content Strategy' },
        { key: 'cms_login_avatar', value: '/assets/boy_idea_shock.png' },
        {
            key: 'enabled_modules',
            value: JSON.stringify([
                'auth', 'users', 'roles', 'settings', 'media',
                'audit-log', 'mail', 'notifications', 'invitations', 'tasks',
                'blogs', 'categories', 'tags', 'comments',
                'seo', 'redirects', 'analytics', 'sitemap', 'robots',
                'menus', 'pages', 'themes',
            ])
        },
        { key: 'setup_complete', value: 'true' },
    ];

    for (const setting of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }

    console.log('Default settings and modules initialized.');

    console.log('--- Seeding Completed ---');
    console.log('Note: Theme demo content (plots, pages, menus etc.) is seeded via Themes → Activate with "Import demo content".');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
