import knex from "../../../lib/db";
import { cookies } from "next/headers";
import { verifyToken, getUser } from "../../../lib/services/authService";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode"); // 'Online', 'Cash', or 'Export'
    
    if (!mode || mode === 'Export') {
      return Response.json({ nextSequence: 1 }, { status: 200 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const modeChar = mode === 'Online' ? 'O' : 'C';
    const prefix = `LS/${modeChar}/`;
    
    // Financial Year Logic (starts April)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const startYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    const financialYear = `${startYear}-${endYear}`;
    const yearSuffix = `/${financialYear}`;

    // Query for the highest sequence number for this mode and year
    // We search for invoice_number starting with prefix 'LS/[O|C]/' and ending with current year '/YY'
    const lastInvoice = await knex("loose_diamond_sales")
      .where('invoice_number', 'like', `${prefix}%${yearSuffix}`)
      .orderBy('id', 'desc')
      .first();

    let nextSequence = 1;
    if (lastInvoice && lastInvoice.invoice_number) {
      // Extract the sequence number from LS/O/123/24
      const parts = lastInvoice.invoice_number.split('/');
      if (parts.length >= 3) {
        const seq = parseInt(parts[2]);
        if (!isNaN(seq)) {
          nextSequence = seq + 1;
        }
      }
    }

    return Response.json({ 
        nextSequence,
        prefix,
        yearSuffix,
        suggestedInvoice: `${prefix}${nextSequence}${yearSuffix}`
    }, { status: 200 });

  } catch (e) {
    console.error("Error fetching invoice sequence:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
