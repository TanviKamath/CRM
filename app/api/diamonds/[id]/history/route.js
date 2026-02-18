import knex from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        const { id } = params;

        // Fetch history and diamond details in parallel
        const [history, diamond] = await Promise.all([
            knex("diamond_history")
                .where({ diamond_id: id })
                .orderBy("created_at", "desc"),
            knex("diamonds")
                .where({ id })
                .select("created_at", "location")
                .first()
        ]);

        // Synthesize CREATED event if not present in DB history
        const hasCreatedEvent = history.some(h => h.event_type === "CREATED");

        if (!hasCreatedEvent && diamond) {
            // "CREATED" is the oldest event, so push to end if sorting DESC
            history.push({
                id: `synthetic-created-${id}`,
                diamond_id: id,
                event_type: "CREATED",
                from_place: null,
                to_place: diamond.location || "Unknown",
                notes: "Diamond created (System Auto-generated)",
                created_at: diamond.created_at
            });
        }

        // Re-sort just in case
        history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return NextResponse.json(history);
    } catch (err) {
        console.error("Error fetching history:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
