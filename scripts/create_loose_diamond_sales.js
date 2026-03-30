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
        console.log('Checking for loose_diamond_sales table...');
        const exists = await db.schema.hasTable('loose_diamond_sales');
        if (exists) {
            console.log('loose_diamond_sales table already exists. Dropping for fresh start...');
            await db.schema.dropTable('loose_diamond_sales');
        }

        console.log('Creating loose_diamond_sales table...');
        await db.schema.createTable('loose_diamond_sales', (table) => {
            table.bigIncrements('id').primary();
            table.bigInteger('sale_id').unsigned().notNullable();
            table.bigInteger('lot_id').unsigned().notNullable();
            table.bigInteger('sublot_id').unsigned().notNullable();
            table.decimal('sold_carats', 10, 3).notNullable();
            table.bigInteger('client_id').unsigned().notNullable();
            table.bigInteger('broker_id').unsigned().nullable();
            table.decimal('brokerage_amount', 15, 2).defaultTo(0);
            table.string('status', 50).defaultTo('active');
            table.text('notes').nullable();
            table.decimal('sale_amount', 15, 2).notNullable();
            table.decimal('conversion_rate', 10, 4).defaultTo(1);
            table.decimal('sale_amount_inr', 15, 2).notNullable();
            table.decimal('sale_rap_discount', 5, 2).defaultTo(0);
            table.decimal('brokerage_rate', 5, 2).defaultTo(0);
            table.date('selling_date').notNullable();
            table.string('payment_status', 50).defaultTo('pending');
            table.integer('terms_days').defaultTo(0);
            table.decimal('advance_amount', 15, 2).defaultTo(0);
            table.date('due_date').nullable();
            table.string('payment_mode', 100).nullable();
            table.string('invoice_number', 100).nullable();
            table.timestamps(true, true);

            table.foreign('sale_id').references('sales.id').onDelete('CASCADE');
            table.foreign('lot_id').references('loose_diamond.id');
            table.foreign('sublot_id').references('loose_diamond_items.id');
        });
        console.log('loose_diamond_sales table created successfully.');

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
