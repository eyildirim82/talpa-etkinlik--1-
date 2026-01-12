const fs = require('fs');
const path = require('path');

try {
    let output = '';

    const settingsPath = path.join('.gemini', 'settings.json');
    if (fs.existsSync(settingsPath)) {
        output += '--- SETTINGS START ---\n';
        output += fs.readFileSync(settingsPath, 'utf8');
        output += '\n--- SETTINGS END ---\n';
    } else {
        output += 'Settings file not found\n';
    }

    const envPath = '.env';
    if (fs.existsSync(envPath)) {
        output += '--- ENV START ---\n';
        output += fs.readFileSync(envPath, 'utf8');
        output += '\n--- ENV END ---\n';
    } else {
        output += 'Env file not found\n';
    }

    fs.writeFileSync('creds_dump.txt', output);
    console.log('Dumped to creds_dump.txt');
} catch (e) {
    console.error(e);
}
