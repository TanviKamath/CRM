import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { lots } = body;

    if (!lots || !Array.isArray(lots) || lots.length === 0) {
      return new Response("No lots provided", { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const results = await db.transaction(async (trx) => {
      const createdLots = [];

      for (const lotData of lots) {
        // 1. Insert Lot
        const [lotId] = await trx("loose_diamond").insert({
          user_id: decoded.id,
          lot_number: lotData.lot_number,
          supplier_name: lotData.supplier_name || "Excel Import",
          total_carats: lotData.total_carats,
          original_price_per_carat: lotData.original_price_per_carat,
          total_purchase_value: lotData.total_purchase_value,
          purchase_date: lotData.purchase_date || db.fn.now(),
          remarks: lotData.remarks || "Bulk Imported",
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        });

        // 2. Insert Items
        if (lotData.items && lotData.items.length > 0) {
          const itemsToInsert = lotData.items.map((item) => ({
            loose_diamond_id: lotId,
            color_category: item.color_category,
            size_category: item.size_category,
            grade: item.grade,
            carats: item.carats,
            base_price: item.base_price,
            discount_pct: item.discount_pct || 0,
            final_price_per_carat: item.final_price_per_carat,
            total_value: item.total_value,
            created_at: db.fn.now(),
            updated_at: db.fn.now(),
          }));
          await trx("loose_diamond_items").insert(itemsToInsert);
        }
        
        createdLots.push(lotId);
      }
      return createdLots;
    });

    return Response.json({ success: true, count: results.length });
  } catch (err) {
    console.error("Bulk Import Error:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      return new Response("Duplicate Lot Number found. Please check your Excel file.", { status: 400 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
