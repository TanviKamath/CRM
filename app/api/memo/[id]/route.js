import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function PUT(request, context) {
  const params = await context.params;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const id = params.id;
    const body = await request.json();
    const { action, carats } = body;

    const memo = await db("on_memo").where("id", id).first();
    if (!memo) {
      return new Response(JSON.stringify({ error: "Memo not found" }), { status: 404 });
    }

    if (action === "return") {
        const returnCarats = parseFloat(carats || memo.carats);
        if (returnCarats > memo.carats) return new Response(JSON.stringify({ error: "Return carats exceed memo carats" }), { status: 400 });
        
        if (returnCarats === parseFloat(memo.carats)) {
            await db("on_memo").where("id", id).update({ status: "returned", updated_at: new Date() });
        } else {
            await db("on_memo").where("id", id).update({ carats: parseFloat(memo.carats) - returnCarats, updated_at: new Date() });
        }
        return Response.json({ message: "Returned successfully" });
    } else if (action === "convert_sale") {
        // Note: this just updates the memo status. The actual sale record should be inserted via /api/sales
        const saleCarats = parseFloat(carats || memo.carats);
        if (saleCarats > memo.carats) return new Response(JSON.stringify({ error: "Sale carats exceed memo carats" }), { status: 400 });

        if (saleCarats === parseFloat(memo.carats)) {
            await db("on_memo").where("id", id).update({ status: "sold", updated_at: new Date() });
        } else {
            await db("on_memo").where("id", id).update({ carats: parseFloat(memo.carats) - saleCarats, updated_at: new Date() });
        }
        return Response.json({ message: "Marked as sold" });
    } else if (action === "update") {
        const { client_id, broker_id, carats: newCarats, selling_price_per_carat } = body;
        
        // Validation for carats availability
        if (newCarats && parseFloat(newCarats) !== parseFloat(memo.carats)) {
            const item = await db("loose_diamond_items").where("id", memo.loose_diamond_item_id).first();
            const { total_on_memo } = await db("on_memo")
                .where("loose_diamond_item_id", memo.loose_diamond_item_id)
                .where("status", "active")
                .whereNot("id", id)
                .sum("carats as total_on_memo")
                .first() || { total_on_memo: 0 };
            
            const availableTotal = parseFloat(item.carats);
            if (parseFloat(newCarats) + parseFloat(total_on_memo || 0) > availableTotal) {
                return new Response(JSON.stringify({ error: "Not enough carats available in stock to update this memo." }), { status: 400 });
            }
        }

        await db("on_memo").where("id", id).update({
            client_id: client_id || null,
            broker_id: broker_id || null,
            carats: newCarats || memo.carats,
            selling_price_per_carat: selling_price_per_carat || null,
            updated_at: new Date()
        });

        return Response.json({ message: "Updated successfully" });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });

  } catch (err) {
    console.error("Memo update error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
