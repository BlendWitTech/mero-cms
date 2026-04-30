const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log("Checking DB state:");
    try {
        const page = await prisma.page.findUnique({ where: { slug: 'home' }});
        console.log(`Home Page exists: ${!!page}`);
        if (page) {
            console.log(`Status: ${page.status}`);
            console.log(`Theme: ${page.theme}`);
        }
    } catch(e) {
        console.log('Error:', e.message);
    }
}
main().finally(() => prisma.$disconnect());
