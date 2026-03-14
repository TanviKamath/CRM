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
        console.log('Cleaning up existing tables if any...');
        await db.schema.dropTableIfExists('loose_diamond_items');
        await db.schema.dropTableIfExists('loose_diamond');

        // 1. Create loose_diamond table
        console.log('Creating loose_diamond table...');
        await db.schema.createTable('loose_diamond', (table) => {
            table.bigIncrements('id').primary();
            table.bigInteger('user_id').unsigned().notNullable(); // Owner of the lot
            table.string('lot_number').notNullable().unique();
            table.string('supplier_name').nullable();
            table.decimal('total_carats', 10, 3).notNullable();
            table.decimal('original_price_per_carat', 15, 2).notNullable();
            table.decimal('total_purchase_value', 15, 2).notNullable();
            table.date('purchase_date').nullable();
            table.text('remarks').nullable();
            table.string('status').defaultTo('Active'); // Active, Sold, Processing
            table.timestamps(true, true);
            
            table.foreign('user_id').references('users.id');
        });
        console.log('loose_diamond table created.');

        // 2. Create loose_diamond_items (bifurcations) table
        console.log('Creating loose_diamond_items table...');
        await db.schema.createTable('loose_diamond_items', (table) => {
            table.bigIncrements('id').primary();
            table.bigInteger('loose_diamond_id').unsigned().notNullable();
            table.string('color_category').nullable();
            table.string('size_category').nullable();
            table.string('grade').nullable();
            table.decimal('carats', 10, 3).notNullable();
            table.decimal('base_price', 15, 2).nullable();
            table.decimal('discount_pct', 5, 2).defaultTo(0);
            table.decimal('final_price_per_carat', 15, 2).notNullable();
            table.decimal('total_value', 15, 2).notNullable();
            table.timestamps(true, true);

            table.foreign('loose_diamond_id').references('loose_diamond.id').onDelete('CASCADE');
        });
        console.log('loose_diamond_items table created.');

        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
