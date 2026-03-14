const path = require('path');
const dotenv = require('dotenv');

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '../.env.local') });
console.log('.env.local loaded successfully');

const db = require('../app/lib/db');

async function cleanup() {
    try {
        console.log('Cleaning up old tables...');
        await db.schema.dropTableIfExists('mix_lot_items');
        await db.schema.dropTableIfExists('mix_lots');
        console.log('Old tables dropped successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Cleanup failed:', e);
        process.exit(1);
    }
}

cleanup();
