const fs = require('fs');
const path = require('path');

// Manually load .env
try {
    const envPath = path.resolve(__dirname, '../.env.local'); // Check .env.local first
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('.env.local loaded successfully');
    } else {
        const envPath2 = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath2)) {
            const envConfig = fs.readFileSync(envPath2, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
            console.log('.env loaded successfully');
        } else {
            console.warn('No .env file found');
        }
    }
} catch (e) {
    console.error('Error loading .env:', e);
}

const db = require('../app/lib/db');

async function migrate() {
    try {
        const hasColumn = await db.schema.hasColumn('users', 'client_type');

        if (!hasColumn) {
            console.log('Adding client_type column to users table...');
            await db.schema.alterTable('users', (table) => {
                table.string('client_type').nullable().after('subscription');
            });
            console.log('client_type column added successfully.');
        } else {
            console.log('client_type column already exists in users table.');
        }   

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
