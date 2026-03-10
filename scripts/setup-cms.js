const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    console.log('--- CMS Setup Automation ---');

    const orgName = await ask('Enter organization name (e.g., blendwit): ');
    if (!orgName) {
        console.error('Organization name is required.');
        process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), `../${orgName}-cms`);
    console.log(`Creating CMS instance in: ${targetDir}`);

    if (fs.existsSync(targetDir)) {
        const overwrite = await ask('Directory already exists. Overwrite? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Aborting.');
            process.exit(0);
        }
        fs.rmSync(targetDir, { recursive: true, force: true });
    }

    fs.mkdirSync(targetDir, { recursive: true });

    // Copy core files/folders
    const toCopy = ['backend', 'frontend', 'docker-compose.yml', 'package.json'];
    for (const item of toCopy) {
        const src = path.join(process.cwd(), item);
        const dest = path.join(targetDir, item);
        console.log(`Copying ${item}...`);
        fs.cpSync(src, dest, { recursive: true });
    }

    // Configure .env for backend
    const backendEnvPath = path.join(targetDir, 'backend', '.env');
    const dbName = `${orgName}_cms`;
    const jwtSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    let backendEnv = `DATABASE_URL="postgresql://admin:password123@localhost:5432/${dbName}?schema=public"\n`;
    backendEnv += `JWT_SECRET="${jwtSecret}"\n`;
    backendEnv += `PORT=3001\n`;
    backendEnv += `FRONTEND_URL="http://localhost:3000"\n`;

    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log('Backend .env configured.');

    // Configure .env for frontend
    const frontendEnvPath = path.join(targetDir, 'frontend', '.env.local');
    let frontendEnv = `NEXT_PUBLIC_BASE_URL="http://localhost:3000"\n`;
    frontendEnv += `NEXT_PUBLIC_API_URL="http://localhost:3001"\n`;

    fs.writeFileSync(frontendEnvPath, frontendEnv);
    console.log('Frontend .env configured.');

    const setupMode = await ask('Choose setup mode: [1] Manual (npm install + dev) [2] Docker (docker-compose) [3] Just create files: ');

    if (setupMode === '1') {
        console.log('Running manual setup...');
        try {
            console.log('Installing backend dependencies...');
            execSync('npm install', { cwd: path.join(targetDir, 'backend'), stdio: 'inherit' });

            console.log('Running migrations and seeding database...');
            execSync('npx prisma migrate dev --name init', { cwd: path.join(targetDir, 'backend'), stdio: 'inherit' });
            execSync('npx prisma db seed', { cwd: path.join(targetDir, 'backend'), stdio: 'inherit' });

            console.log('Installing frontend dependencies...');
            execSync('npm install', { cwd: path.join(targetDir, 'frontend'), stdio: 'inherit' });

            console.log('Setup complete! To start:');
            console.log(`cd ../${orgName}-cms/backend && npm run start:dev`);
            console.log(`cd ../${orgName}-cms/frontend && npm run dev`);
        } catch (error) {
            console.error('Setup failed:', error.message);
        }
    } else if (setupMode === '2') {
        console.log('Starting Docker setup...');
        try {
            // Update docker-compose.yml with ORG_NAME for container names if needed
            // (The template already uses ${ORG_NAME:-blendwit})
            process.env.ORG_NAME = orgName;
            process.env.DB_NAME = dbName;
            execSync('docker-compose up -d', { cwd: targetDir, stdio: 'inherit' });
            console.log('Docker containers starting...');
        } catch (error) {
            console.error('Docker setup failed:', error.message);
        }
    } else {
        console.log('Files created. You can now manually complete the setup.');
    }

    console.log('\nDeployment complete.');
    console.log(`Organization: ${orgName}`);
    console.log(`Database: ${dbName}`);
    console.log(`Location: ${targetDir}`);
    console.log('SuperAdmin: superadmin@blendwit.com / admin123');

    rl.close();
}

main();
