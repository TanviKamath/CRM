const fs = require('fs');
const path = require('path');

// Manually load .env
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('.env loaded successfully');
    } else {
        console.warn('.env file not found at', envPath);
    }
} catch (e) {
    console.error('Error loading .env:', e);
}

const db = require('../app/lib/db');

async function migrate() {
    try {
        const hasLocation = await db.schema.hasColumn('diamonds', 'location');

        if (!hasLocation) {
            console.log('Adding location column...');
            await db.schema.alterTable('diamonds', (table) => {
                // Default to 'Surat' for existing records
                table.string('location').defaultTo('Surat').after('status');
            });
            console.log('location column added.');
        } else {
            console.log('location column already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
