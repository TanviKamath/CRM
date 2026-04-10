import { cookies } from "next/headers";
import { verifyToken } from "../../lib/services/authService";
import db from "../../lib/db";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("item_id");

    let query = db("on_memo")
      .leftJoin("clients", "on_memo.client_id", "clients.id")
      .leftJoin("brokers", "on_memo.broker_id", "brokers.id")
      .leftJoin("loose_diamond_items", "on_memo.loose_diamond_item_id", "loose_diamond_items.id")
      .leftJoin("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .where("on_memo.status", "active")
      .where("loose_diamond.user_id", decoded.id)
      .select(
        "on_memo.*",
        "clients.company_name as client_name",
        "brokers.name as broker_name",
        "loose_diamond.lot_number",
        "loose_diamond_items.color_category",
        "loose_diamond_items.size_category",
        "loose_diamond_items.grade"
      )
      .orderBy("on_memo.created_at", "desc");

    if (itemId) {
      query = query.where("on_memo.loose_diamond_item_id", itemId);
    }

    const memos = await query;
    return Response.json(memos);
  } catch (err) {
    console.error("Fetch memos error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const body = await request.json();
    const { loose_diamond_item_id, client_id, broker_id, carats, selling_price_per_carat } = body;

    if (!loose_diamond_item_id || !carats) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Verify carats availability
    const item = await db("loose_diamond_items").where("id", loose_diamond_item_id).first();
    if (!item) {
        return new Response(JSON.stringify({ error: "Item not found" }), { status: 404 });
    }

    const { total_memo } = await db("on_memo")
        .where("loose_diamond_item_id", loose_diamond_item_id)
        .where("status", "active")
        .sum("carats as total_memo")
        .first() || { total_memo: 0 };
    
    const availableCarats = parseFloat(item.carats) - parseFloat(total_memo || 0);

    if (parseFloat(carats) > availableCarats) {
        return new Response(JSON.stringify({ error: "Not enough available carats" }), { status: 400 });
    }

    const [id] = await db("on_memo").insert({
        loose_diamond_item_id,
        client_id: client_id || null,
        broker_id: broker_id || null,
        carats,
        selling_price_per_carat: selling_price_per_carat || null,
        status: "active"
    });

    return Response.json({ message: "Memo created successfully", id });
  } catch (err) {
    console.error("Create memo error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
