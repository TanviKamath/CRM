const fs = require('fs');
const path = require('path');

// Manually load .env
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('.env.local loaded successfully');
    }
} catch (e) {
    console.error('Error loading .env:', e);
}

const db = require('../app/lib/db');

async function migrate() {
    try {
        const hasLooseItemId = await db.schema.hasColumn('sales', 'loose_diamond_item_id');

        if (!hasLooseItemId) {
            console.log('Adding loose_diamond_item_id column to sales table...');
            await db.schema.alterTable('sales', (table) => {
                table.bigInteger('loose_diamond_item_id').unsigned().nullable().after('diamond_id');
                table.bigInteger('diamond_id').unsigned().nullable().alter();
                
                table.foreign('loose_diamond_item_id').references('loose_diamond_items.id').onDelete('SET NULL');
            });
            console.log('Column added successfully.');
        } else {
            console.log('loose_diamond_item_id already exists.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
