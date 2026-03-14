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
