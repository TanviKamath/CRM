// app/api/sales/[id]/invoice/route.js
import knex from "../../../../lib/db";

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        // Simple query - update to get payment_mode and invoice_number
        const sale = await knex("sales")
            .leftJoin("loose_diamond_sales", "sales.id", "loose_diamond_sales.sale_id")
            .where("sales.id", id)
            .select(
                "sales.*",
                "loose_diamond_sales.payment_mode as loose_payment_mode",
                "loose_diamond_sales.invoice_number as loose_invoice_number",
                "loose_diamond_sales.sold_carats as loose_sold_carats",
                "loose_diamond_sales.sale_amount_inr as loose_sale_amount_inr"
            )
            .first();

        if (sale) {
            sale.payment_mode = sale.payment_mode || sale.loose_payment_mode;
            sale.invoice_number = sale.invoice_number || sale.loose_invoice_number;
            
            // Prioritize loose diamond sales data for carats and amounts if it exists
            if (sale.loose_diamond_item_id && sale.loose_sold_carats !== null) {
                sale.sold_carats = sale.loose_sold_carats;
                sale.sale_amount_inr = sale.loose_sale_amount_inr || sale.sale_amount_inr;
            }
        }

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
            payment_mode: sale.payment_mode,
            invoice_number: sale.invoice_number,
            sold_carats: sale.sold_carats,
            diamond: diamond,
            client: client,
        });

    } catch (e) {
        console.error("Invoice data error:", e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}