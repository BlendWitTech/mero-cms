const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n--- Mero CMS Start Manager ---');
console.log('1. Development (Hot-Reload)');
console.log('2. Live Preview (Production Build)');
console.log('3. Test Mode');

rl.question('\nSelect environment [1-3]: ', (choice) => {
    let command, args;

    switch (choice) {
        case '1':
            console.log('\nStarting in DEVELOPMENT mode...');
            command = 'npm';
            args = ['run', 'dev'];
            break;
        case '2':
            console.log('\nStarting in PRODUCTION mode (ensure you ran npm run build!)');
            // Assuming we have a start:prod script in workspaces
            command = 'npm';
            args = ['run', 'start'];
            break;
        case '3':
            console.log('\nStarting in TEST mode...');
            command = 'npm';
            args = ['run', 'test'];
            break;
        default:
            console.log('Invalid choice. Exiting.');
            rl.close();
            return;
    }

    rl.close();

    const proc = spawn(command, args, {
        shell: true,
        stdio: 'inherit'
    });

    proc.on('close', (code) => {
        process.exit(code);
    });
});
