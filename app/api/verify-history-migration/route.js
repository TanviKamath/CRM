import knex from "../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Always drop to ensure correct schema
        await knex.schema.dropTableIfExists('diamond_history');

        await knex.schema.createTable('diamond_history', (table) => {
            table.increments('id').primary();
            table.bigInteger('diamond_id').unsigned().references('id').inTable('diamonds').onDelete('CASCADE');
            table.string('event_type').notNullable(); // 'CREATED', 'MOVED', 'SOLD', 'RETURNED'
            table.string('from_place').nullable();
            table.string('to_place').nullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.text('notes').nullable();
        });

        return NextResponse.json({ message: 'Recreated diamond_history table' });
    } catch (err) {
        console.error('Migration failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
