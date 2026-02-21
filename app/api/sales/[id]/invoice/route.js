// app/api/sales/[id]/invoice/route.js
import knex from "../../../../lib/db";

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        // Simple query - only get what we need
        const sale = await knex("sales")
            .where("sales.id", id)
            .first();

        if (!sale) {
            return Response.json({ error: "Sale not found" }, { status: 404 });
        }

        // Get diamond separately
        let diamond = null;
        if (sale.diamond_id) {
            diamond = await knex("diamonds")
                .where("id", sale.diamond_id)
                .select("certificate_number", "shape", "weight", "color", "clarity")
                .first();
        }

        // Get client separately
        let client = null;
        if (sale.client_id) {
            client = await knex("clients")
                .where("id", sale.client_id)
                .first();
        }

        // Get total payments
        let totalPayments = 0;
        try {
            const result = await knex("sale_payments")
                .where("sale_id", id)
                .sum("payment_amount_done as total")
                .first();
            totalPayments = parseFloat(result?.total) || 0;
        } catch (e) { }

        // Return simple response
        return Response.json({
            id: sale.id,
            sale_amount: sale.sale_amount,
            sale_amount_inr: sale.sale_amount_inr,
            conversion_rate: sale.conversion_rate,
            selling_date: sale.selling_date || sale.created_at,
            advance_amount: sale.advance_amount || 0,
            total_payments: totalPayments,
            payment_status: sale.payment_status,
            terms_days: sale.terms_days,
            due_date: sale.due_date,
            diamond: diamond,
            client: client,
        });

    } catch (e) {
        console.error("Invoice data error:", e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}