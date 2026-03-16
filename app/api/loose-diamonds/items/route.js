import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const onlyAvailable = searchParams.get("available") === "true";

    let query = db("loose_diamond_items")
      .join("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .where("loose_diamond.user_id", decoded.id)
      .select(
        "loose_diamond_items.*",
        "loose_diamond.lot_number",
        "loose_diamond.supplier_name",
        "loose_diamond.purchase_date"
      )
      .orderBy("loose_diamond.created_at", "desc")
      .orderBy("loose_diamond_items.id", "asc");

    if (onlyAvailable) {
      // Exclude items that already have an associated sale
      const soldItemIds = await db("sales")
        .whereNotNull("loose_diamond_item_id")
        .pluck("loose_diamond_item_id");

      if (soldItemIds.length > 0) {
        query = query.whereNotIn("loose_diamond_items.id", soldItemIds);
      }
    }

    const items = await query;
    return Response.json(items);
  } catch (err) {
    console.error("Fetch loose items error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
