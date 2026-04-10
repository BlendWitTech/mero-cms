const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const activeTheme = await prisma.setting.findUnique({ where: { key: 'active_theme' } });
    const enabledModules = await prisma.setting.findUnique({ where: { key: 'enabled_modules' } });
    const heroTitle = await prisma.setting.findUnique({ where: { key: 'hero_title' } });
    
    console.log('--- CMS Status ---');
    console.log('Active Theme:', activeTheme?.value || 'NONE');
    console.log('Enabled Modules:', enabledModules?.value || 'DEFAULT');
    console.log('Hero Title (setting):', heroTitle?.value || 'NOT SET');
    
    const pageCount = await prisma.page.count();
    console.log('Total Pages:', pageCount);
    
    if (activeTheme?.value) {
        const homePage = await prisma.page.findFirst({ where: { slug: 'home', theme: activeTheme.value } });
        console.log('Home Page (Active Theme):', homePage ? 'FOUND' : 'NOT FOUND');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
