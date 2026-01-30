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
        const hasClientId = await db.schema.hasColumn('diamonds', 'client_id');
        const hasBrokerId = await db.schema.hasColumn('diamonds', 'broker_id');

        if (!hasClientId) {
            console.log('Adding client_id column...');
            await db.schema.alterTable('diamonds', (table) => {
                table.integer('client_id').unsigned().nullable().after('purchase_price_inr');
            });
            console.log('client_id added.');
        } else {
            console.log('client_id already exists.');
        }

        if (!hasBrokerId) {
            console.log('Adding broker_id column...');
            await db.schema.alterTable('diamonds', (table) => {
                table.integer('broker_id').unsigned().nullable().after('client_id');
            });
            console.log('broker_id added.');
        } else {
            console.log('broker_id already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
