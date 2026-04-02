import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/services/authService";
import db from "../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lot_number = searchParams.get("lot_number");
    const excludeId = searchParams.get("excludeId");

    if (!lot_number) {
      return Response.json({ available: true });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    let query = db("loose_diamond")
      .where({ user_id: decoded.id, lot_number });

    if (excludeId) {
      query = query.whereNot("id", excludeId);
    }

    const existing = await query.first();

    return Response.json({ available: !existing });
  } catch (err) {
    console.error("Lot validation error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
