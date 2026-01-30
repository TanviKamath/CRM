import knex from "../../../lib/db";

export async function POST(req) {
    try {
        const { ids, to_place, notes } = await req.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return Response.json({ error: "No diamonds selected" }, { status: 400 });
        }

        if (!to_place) {
            return Response.json({ error: "Destination place is required" }, { status: 400 });
        }

        await knex.transaction(async (trx) => {
            for (const id of ids) {
                const diamond = await trx("diamonds").where({ id }).first();
                if (!diamond) continue;

                const from_place = diamond.location || "Unknown";

                await trx("diamonds").where({ id }).update({
                    location: to_place,
                    updated_at: knex.fn.now()
                });

                await trx("diamond_history").insert({
                    diamond_id: id,
                    event_type: "MOVED",
                    from_place: from_place,
                    to_place: to_place,
                    notes: notes || null,
                    created_at: knex.fn.now()
                });
            }
        });

        return Response.json({ success: true, count: ids.length });
    } catch (e) {
        console.error("Transfer Error:", e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}
