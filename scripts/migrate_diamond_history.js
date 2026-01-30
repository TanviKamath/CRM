const knex = require('../app/lib/db');

async function migrate() {
    try {
        const hasTable = await knex.schema.hasTable('diamond_history');
        if (!hasTable) {
            await knex.schema.createTable('diamond_history', (table) => {
                table.increments('id').primary();
                table.integer('diamond_id').unsigned().references('id').inTable('diamonds').onDelete('CASCADE');
                table.string('event_type').notNullable(); // 'CREATED', 'MOVED', 'SOLD', 'RETURNED'
                table.string('from_place').nullable();
                table.string('to_place').nullable();
                table.timestamp('created_at').defaultTo(knex.fn.now());
                table.text('notes').nullable();
            });
            console.log('Created diamond_history table');
        } else {
            console.log('diamond_history table already exists');
        }
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
