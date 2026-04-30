const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI Colors & Styles
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bgBlue: '\x1b[44m',
};

const symbols = {
    info: 'ℹ',
    success: '✔',
    warning: '⚠',
    error: '✖',
    rocket: '🚀',
    box: '📦',
    tools: '🛠️',
    db: '🗄️',
    clean: '🧹',
};

// Logger Helpers
const log = {
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    step: (msg) => console.log(`${colors.gray}─── ${colors.reset}${msg}`),
    info: (msg) => console.log(`${colors.blue}${symbols.info} ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}${symbols.success} ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}${symbols.warning} ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}${symbols.error} ${msg}${colors.reset}`),
    accent: (msg) => `${colors.magenta}${msg}${colors.reset}`,
};

const banner = `
${colors.cyan}${colors.bright}
   __  __ ______ _____   ____     _____ __  __  _____ 
  |  \\/  |  ____|  __ \\ / __ \\   / ____|  \\/  |/ ____|
  | \\  / | |__  | |__) | |  | | | |    | \\  / | (___  
  | |\\/| |  __| |  _  /| |  | | | |    | |\\/| |\\___ \\ 
  | |  | | |____| | \\ \\| |__| | | |____| |  | |____) |
  |_|  |_|______|_|  \\_\\\\____/   \\_____|_|  |_|_____/ 
${colors.reset}${colors.dim}             Premium Agentic CMS Engine${colors.reset}
`;

function printBanner() {
    process.stdout.write('\x1Bc'); // Clear console
    console.log(banner);
}

async function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: options.silent ? 'ignore' : 'inherit',
            shell: true,
            ...options
        });

        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with exit code ${code}`));
        });
    });
}

const commands = {
    setup: async () => {
        printBanner();
        log.header(`${symbols.tools} Starting CMS Setup...`);
        
        try {
            log.step('Initializing core installation');
            await runCommand('powershell', ['-ExecutionPolicy', 'Bypass', '-File', './scripts/setup.ps1']);
            
            log.header(`${symbols.success} Setup Complete!`);
            console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
            console.log(`${colors.cyan}1. Run:${colors.reset} npm run dev`);
            console.log(`${colors.cyan}2. Open:${colors.reset} http://localhost:3000/setup\n`);
        } catch (err) {
            log.error(`Setup failed: ${err.message}`);
            process.exit(1);
        }
    },

    reset: async () => {
        printBanner();
        log.header(`${symbols.clean} Performing System Reset...`);
        
        try {
            await runCommand('powershell', ['-ExecutionPolicy', 'Bypass', '-File', './scripts/reset.ps1']);
            log.success('System reset successfully.');
        } catch (err) {
            log.error(`Reset failed: ${err.message}`);
            process.exit(1);
        }
    },

    dev: async (all = false) => {
        printBanner();
        log.header(`${symbols.rocket} Launching Development Environment...`);
        
        if (all) {
            log.step(`Ensuring ${log.accent('Docker DB')} is running...`);
            try {
                execSync('docker compose up db -d', { stdio: 'ignore' });
                log.success('Database container is ready.');
            } catch (e) {
                log.warn('Docker not found or failed to start. Skipping Docker DB.');
            }
        }

        log.step(`Generating ${log.accent('Prisma Client')}...`);
        try {
            execSync('npm run prisma:generate', { stdio: 'ignore' });
            log.success('Prisma Client generated.');
        } catch (e) {
            log.error('Prisma generation failed. Please check your database connection.');
            process.exit(1);
        }

        log.step('Starting application services...');
        
        // Port conflict detection
        try {
            const ports = [3000, 3001];
            for (const port of ports) {
                try {
                    const stdout = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { encoding: 'utf8' });
                    if (stdout.trim()) {
                        log.warn(`Port ${port} is already in use. This may cause service conflicts.`);
                    }
                } catch (e) { /* Port is free */ }
            }
        } catch (e) {}

        console.log(`${colors.dim}Backend:  http://localhost:3001${colors.reset}`);
        console.log(`${colors.dim}Frontend: http://localhost:3000${colors.reset}`);
        console.log(`${colors.dim}Theme:    (resolved from active_theme)${colors.reset}\n`);

        await runCommand('npx', [
            'concurrently',
            '--restart-tries 5',
            '--restart-after 1500',
            '--prefix-colors "blue,green,magenta"',
            '--names "BACKEND,FRONTEND,THEME"',
            '"npm run dev:backend"',
            '"npm run dev:frontend"',
            '"npm run dev:theme"'
        ]);
    },

    clean: async () => {
        printBanner();
        log.header(`${symbols.clean} Cleaning Ghost Processes...`);
        const ports = [3000, 3001, 3002];
        
        for (const port of ports) {
            try {
                const stdout = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { encoding: 'utf8' });
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0') {
                        log.step(`Killing process ${pid} on port ${port}...`);
                        try {
                            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                            log.success(`Killed PID ${pid}`);
                        } catch (e) {
                            log.error(`Failed to kill PID ${pid}`);
                        }
                    }
                }
            } catch (e) {
                log.info(`Port ${port} is already clean.`);
            }
        }
        log.header(`${symbols.success} Cleanup Complete!`);
    }
};

async function main() {
    const arg = process.argv[2];

    switch (arg) {
        case 'setup':
            await commands.setup();
            break;
        case 'reset':
            await commands.reset();
            break;
        case 'clean':
            await commands.clean();
            break;
        case 'dev':
            await commands.dev(false);
            break;
        case 'dev:all':
            await commands.dev(true);
            break;
        default:
            printBanner();
            console.log(`${colors.bright}Usage:${colors.reset} node scripts/mero.js <command>`);
            console.log(`\n${colors.bright}Commands:${colors.reset}`);
            console.log(`  ${colors.cyan}setup${colors.reset}     Initializes the CMS (Install, DB, Seeds)`);
            console.log(`  ${colors.cyan}reset${colors.reset}     Wipes dependencies, builds, and database`);
            console.log(`  ${colors.cyan}clean${colors.reset}     Kills ghost processes on ports 3000-3002`);
            console.log(`  ${colors.cyan}dev${colors.reset}       Starts the development environment`);
            console.log(`  ${colors.cyan}dev:all${colors.reset}   Starts Docker DB and development environment`);
            break;
    }
}

main();
