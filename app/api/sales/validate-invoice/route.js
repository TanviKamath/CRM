import knex from "../../../lib/db";
import { cookies } from "next/headers";
import { verifyToken, getUser } from "../../../lib/services/authService";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const invoice = url.searchParams.get("invoice_number");
    
    if (!invoice) {
      return Response.json({ available: true }, { status: 200 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const excludeSaleId = url.searchParams.get("exclude_sale_id");
    
    let query = knex("loose_diamond_sales").where("invoice_number", invoice);
    if (excludeSaleId) {
      query = query.whereNot("sale_id", excludeSaleId);
    }
    
    const existing = await query.first();

    return Response.json({ 
        available: !existing,
        message: existing ? "This invoice number already exists. Please choose the next number." : "Available"
    }, { status: 200 });

  } catch (e) {
    console.error("Error validating invoice:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
