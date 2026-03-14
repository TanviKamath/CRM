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
      .where("user_id", decoded.id)
      .orderBy("created_at", "desc");

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
        // Validate total carats match
        const splitCarats = items.reduce((sum, item) => sum + parseFloat(item.carats || 0), 0);
        if (Math.abs(splitCarats - total_carats) > 0.001) {
            throw new Error(`Split carats (${splitCarats}) must equal original lot carats (${total_carats})`);
        }

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
    console.error("Lot creation error:", err);
    return new Response(err.message || "Internal Server Error", { status: 500 });
  }
}
