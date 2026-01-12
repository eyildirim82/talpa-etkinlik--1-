const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'kqxzhvtynugglzikchhy';
const ACCESS_TOKEN = 'sbp_1ea553688c292e62abb5169fab14dbd162548509';
const SCHEMA_PATH = path.join('supabase', 'consolidated_schema.sql');

async function applySchema() {
    try {
        const sqlContent = fs.readFileSync(SCHEMA_PATH, 'utf8');

        console.log(`Applying schema to project ${PROJECT_REF}...`);
        console.log(`SQL Length: ${sqlContent.length} chars`);

        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                query: sqlContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error applying schema:', response.status, response.statusText);
            console.error('Details:', errorText);
            process.exit(1);
        }

        const result = await response.json();
        console.log('Schema applied successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

applySchema();
