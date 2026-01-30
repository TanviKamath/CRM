import knex from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        const { id } = params;

        const history = await knex("diamond_history")
            .where({ diamond_id: id })
            .orderBy("created_at", "desc");

        return NextResponse.json(history);
    } catch (err) {
        console.error("Error fetching history:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
