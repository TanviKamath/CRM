process.loadEnvFile('.env.local');
const db = require('./app/lib/db');

(async () => {
    try {
        await db.schema.createTable('lot_payments', table => {
            table.increments('id').primary();
            table.integer('lot_id').unsigned().notNullable();
            // Since loose_diamond id is int, we don't need bigint unless it is.
            table.decimal('payment_amount_done', 15, 2).notNullable().defaultTo(0.00);
            table.date('payment_date').nullable();
            table.string('payment_method', 50).nullable();
            table.string('reference', 255).nullable();
            table.text('notes').nullable();
            table.timestamp('created_at').defaultTo(db.fn.now());
            table.timestamp('updated_at').defaultTo(db.fn.now());
        });
        console.log('lot_payments table created.');
        
        await db.raw('ALTER TABLE loose_diamond ADD COLUMN payment_status VARCHAR(50) DEFAULT \'on_terms\' AFTER status');
        await db.raw('ALTER TABLE loose_diamond ADD COLUMN due_date DATE NULL AFTER payment_status');
        console.log('loose_diamond altered.');
    } catch (e) {
        console.error(e);
    }
    process.exit();
})();
