import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Database ---');

    // 1. Create Roles (structural data required by the app)
    // level 0 = Super Admin (highest privilege), higher number = lower privilege
    await prisma.role.upsert({
        where: { name: 'Super Admin' },
        update: { level: 0 },
        create: {
            name: 'Super Admin',
            level: 0,
            permissions: { all: true },
        },
    });

    await prisma.role.upsert({
        where: { name: 'Admin' },
        update: { level: 5 },
        create: {
            name: 'Admin',
            level: 5,
            permissions: { manage_content: true, manage_media: true },
        },
    });

    console.log('Roles created/verified.');

    // 2. Initialize CMS UI settings (login screen branding only)
    // NOTE: Do NOT seed setup_complete or create a superadmin user here.
    // The setup wizard (/setup) is responsible for:
    //   - Creating the first superadmin user with credentials the owner chooses
    //   - Setting setup_complete = 'true' once the wizard finishes
    //   - Configuring enabled modules
    const uiSettings = [
        { key: 'cms_title', value: 'Mero CMS' },
        { key: 'cms_subtitle', value: 'Elevate Your Content Strategy' },
        { key: 'cms_login_avatar', value: '/assets/boy_idea_shock.png' },
    ];

    for (const setting of uiSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: {},  // never overwrite if already customised
            create: setting,
        });
    }

    console.log('CMS UI settings initialized.');
    console.log('--- Seeding Completed ---');
    console.log('Next step: Open the admin panel and complete the setup wizard to create your superadmin account.');
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
