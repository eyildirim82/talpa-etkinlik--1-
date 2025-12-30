const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');

console.log('Checking connection...');

try {
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env.local file not found!');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            envVars[key] = value;
        }
    });

    const url = envVars.VITE_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
    const key = envVars.VITE_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('Error: Supabase URL/Key not found in .env.local');
        // Log keys found to help debug (without values)
        console.log('Found keys:', Object.keys(envVars));
        process.exit(1);
    }

    // console.log('Testing connection to:', url); 
    // Don't log full URL if it has sensitive info, though usually URL is public.

    const options = {
        method: 'GET',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    };

    // Test request to Supabase REST API (health check or basic query)
    // Just checking root /rest/v1/ usually gives metadata or 404 but proves connectivity
    const req = https.request(`${url}/rest/v1/`, options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);

        if (res.statusCode >= 200 && res.statusCode < 500) {
            console.log('✅ Connection to Supabase successful!');
        } else {
            console.error('❌ Connection failed with status:', res.statusCode);
            res.on('data', (d) => {
                console.error('Response:', d.toString());
            });
        }
    });

    req.on('error', (e) => {
        console.error('❌ Network error:', e.message);
    });

    req.end();

} catch (err) {
    console.error('Script error:', err);
}
