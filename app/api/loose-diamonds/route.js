import { cookies } from "next/headers";
import { verifyToken } from "../../lib/services/authService";
import db from "../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const lots = await db("loose_diamond")
      .where("loose_diamond.user_id", decoded.id)
      .select(
        "loose_diamond.*",
        db.raw(`
          (SELECT COALESCE(SUM(on_memo.carats), 0)
           FROM loose_diamond_items
           LEFT JOIN on_memo ON loose_diamond_items.id = on_memo.loose_diamond_item_id
           WHERE loose_diamond_items.loose_diamond_id = loose_diamond.id AND on_memo.status = 'active') as total_on_memo
        `),
        db.raw(`
          (SELECT COALESCE(SUM(payment_amount_done), 0)
           FROM lot_payments
           WHERE lot_id = loose_diamond.id) as total_paid
        `)
      )
      .orderBy("loose_diamond.created_at", "desc");

    return Response.json(lots);
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const {
      lot_number,
      supplier_name,
      total_carats,
      original_price_per_carat,
      total_purchase_value,
      purchase_date,
      remarks,
      items // Bifurcated items
    } = body;

    // Basic validation
    if (!lot_number || !total_carats || !original_price_per_carat || !total_purchase_value) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Wrap in transaction
    const result = await db.transaction(async (trx) => {
      // 0. Check for existing lot number
      const existing = await trx("loose_diamond")
        .where({ user_id: decoded.id, lot_number })
        .first();
      
      if (existing) {
        throw new Error("ALREADY_EXISTS");
      }

      // 1. Create the Lot
      const [lotId] = await trx("loose_diamond").insert({
        user_id: decoded.id,
        lot_number,
        supplier_name,
        total_carats,
        original_price_per_carat,
        total_purchase_value,
        purchase_date,
        remarks,
        status: "Active"
      });

      // 2. Create Bifurcated Items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          loose_diamond_id: lotId,
          color_category: item.color_category,
          size_category: item.size_category,
          grade: item.grade,
          carats: item.carats,
          base_price: item.base_price,
          discount_pct: item.discount_pct || 0,
          final_price_per_carat: item.final_price_per_carat,
          total_value: item.total_value
        }));

        await trx("loose_diamond_items").insert(itemsToInsert);
      }

      return lotId;
    });

    return Response.json({ success: true, lotId: result }, { status: 201 });
  } catch (err) {
    if (err.message === "ALREADY_EXISTS") {
      return new Response("Lot number already exists. Please use a unique number.", { status: 400 });
    }
    console.error("Lot creation error:", err);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
