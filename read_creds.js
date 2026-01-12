const fs = require('fs');
const path = require('path');

try {
    const settingsPath = path.join('.gemini', 'settings.json');
    if (fs.existsSync(settingsPath)) {
        console.log('--- SETTINGS START ---');
        console.log(fs.readFileSync(settingsPath, 'utf8'));
        console.log('--- SETTINGS END ---');
    } else {
        console.log('Settings file not found');
    }

    const envPath = '.env';
    if (fs.existsSync(envPath)) {
        console.log('--- ENV START ---');
        console.log(fs.readFileSync(envPath, 'utf8'));
        console.log('--- ENV END ---');
    } else {
        console.log('Env file not found');
    }
} catch (e) {
    console.error(e);
}
