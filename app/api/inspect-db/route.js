import knex from "../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const info = await knex.raw("DESCRIBE diamond_history");
        return NextResponse.json(info[0]);
    } catch (err) {
        return NextResponse.json({ error: err.message });
    }
}
