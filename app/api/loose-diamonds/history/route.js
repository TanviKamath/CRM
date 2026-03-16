import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { color_category, size_category, grade } = body;

    if (!color_category || !size_category || !grade) {
      return new Response("Missing required specs", { status: 400 });
    }

    // Find previous matching lot items
    const matches = await db("loose_diamond_items")
      .join("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .where({
        "loose_diamond.user_id": decoded.id,
        "loose_diamond_items.color_category": color_category,
        "loose_diamond_items.size_category": size_category,
        "loose_diamond_items.grade": grade
      })
      .select(
        "loose_diamond.lot_number",
        "loose_diamond_items.carats",
        "loose_diamond_items.final_price_per_carat",
        "loose_diamond.purchase_date",
        "loose_diamond_items.created_at"
      )
      .orderBy("loose_diamond_items.created_at", "desc")
      .limit(5);

    return Response.json(matches);
  } catch (err) {
    console.error("History fetch error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
