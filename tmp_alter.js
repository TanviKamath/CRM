process.loadEnvFile('.env.local');
const db = require('./app/lib/db');
(async () => {
    try {
        await db.raw('ALTER TABLE on_memo ADD COLUMN selling_price_per_carat DECIMAL(15,2) NULL AFTER carats');
        console.log('Column added successfully.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists.');
        else console.error(e);
    }
    process.exit();
})();
