import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const lot = await db("loose_diamond")
      .where({ id, user_id: decoded.id })
      .first();

    if (!lot) return new Response("Lot not found", { status: 404 });

    const items = await db("loose_diamond_items")
      .leftJoin("on_memo", function() {
        this.on("loose_diamond_items.id", "=", "on_memo.loose_diamond_item_id")
            .andOn("on_memo.status", "=", db.raw("?", ["active"]));
      })
      .where("loose_diamond_items.loose_diamond_id", id)
      .select(
        "loose_diamond_items.*",
        db.raw("COALESCE(SUM(on_memo.carats), 0) as total_on_memo_carats")
      )
      .groupBy("loose_diamond_items.id")
      .orderBy("loose_diamond_items.id", "asc");

    return Response.json({ ...lot, items });
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    // Verify ownership
    const lot = await db("loose_diamond")
      .where({ id, user_id: decoded.id })
      .first();

    if (!lot) return new Response("Lot not found", { status: 404 });

    // Delete (Cascade will handle loose_diamond_items)
    await db("loose_diamond").where({ id }).delete();

    return Response.json({ success: true });
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { lot_number, supplier_name, total_carats, original_price_per_carat, total_purchase_value, purchase_date, remarks, items } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    // Verify ownership
    const existingLot = await db("loose_diamond").where({ id, user_id: decoded.id }).first();
    if (!existingLot) return new Response("Lot not found", { status: 404 });

    await db.transaction(async (trx) => {
      // 0. Check for existing lot number (exclude current)
      const existing = await trx("loose_diamond")
        .where({ user_id: decoded.id, lot_number })
        .whereNot({ id })
        .first();
      
      if (existing) {
        throw new Error("ALREADY_EXISTS");
      }

      // 1. Update Lot Details
      await trx("loose_diamond").where({ id }).update({
        lot_number,
        supplier_name,
        total_carats,
        original_price_per_carat,
        total_purchase_value,
        purchase_date,
        remarks,
        updated_at: db.fn.now(),
      });

      // 2. Clear existing items
      await trx("loose_diamond_items").where("loose_diamond_id", id).delete();

      // 3. Insert fresh items
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          loose_diamond_id: id,
          color_category: item.color_category,
          size_category: item.size_category,
          grade: item.grade,
          carats: item.carats,
          base_price: item.base_price,
          discount_pct: item.discount_pct,
          final_price_per_carat: item.final_price_per_carat,
          total_value: item.total_value,
        }));
        await trx("loose_diamond_items").insert(itemsToInsert);
      }
    });

    return Response.json({ success: true });
  } catch (err) {
    if (err.message === "ALREADY_EXISTS") {
      return new Response("Lot number already exists. Please use a unique number.", { status: 400 });
    }
    console.error("PUT Lot Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
