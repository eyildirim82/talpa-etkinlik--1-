const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join('supabase', 'consolidated_schema.sql');

try {
    const sqlContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    const payload = JSON.stringify({ query: sqlContent });
    fs.writeFileSync('payload.json', payload);
    console.log('Generated payload.json');
} catch (e) {
    console.error(e);
}
