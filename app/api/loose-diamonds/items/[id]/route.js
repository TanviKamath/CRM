import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/services/authService";
import db from "../../../../lib/db";

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    // Verify ownership via join
    const item = await db("loose_diamond_items")
      .join("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .where("loose_diamond_items.id", id)
      .andWhere("loose_diamond.user_id", decoded.id)
      .first();

    if (!item) {
      return new Response("Item not found or unauthorized", { status: 404 });
    }

    await db("loose_diamond_items").where("id", id).del();

    return Response.json({ success: true });
  } catch (err) {
    console.error("Delete loose item error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
