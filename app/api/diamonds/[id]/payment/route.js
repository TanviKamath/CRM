import knex from "../../../../lib/db";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        // Fetch diamond details (purchase price, buying date, terms)
        const diamond = await knex("diamonds")
            .select("purchase_price_inr", "payment_status", "buying_date", "terms_days")
            .where({ id })
            .first();

        if (!diamond) {
            return Response.json({
                error: true,
                message: "Diamond not found"
            }, { status: 404 });
        }

        // Fetch total paid so far
        const result = await knex("payment_outstanding")
            .sum("payment_amount_done as total_paid")
            .where({ diamond_id: id })
            .first();

        const totalPaid = result.total_paid || 0;
        const purchasePrice = diamond.purchase_price_inr || 0;
        const outstanding = purchasePrice - totalPaid;

        return Response.json({
            purchase_price: purchasePrice,
            total_paid: totalPaid,
            outstanding: outstanding,
            status: diamond.payment_status,
            buying_date: diamond.buying_date,
            terms_days: diamond.terms_days
        });

    } catch (e) {
        console.error("GET Payment Error:", e);
        return Response.json({
            error: true,
            message: e.message || "Failed to fetch payment details"
        }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const amount = Number(body.amount);
        if (isNaN(amount) || amount <= 0) {
            return Response.json({
                error: true,
                message: "Invalid payment amount"
            }, { status: 400 });
        }

        // Insert new payment record
        await knex("payment_outstanding").insert({
            diamond_id: id,
            payment_amount_done: amount
        });

        return Response.json({ success: true }, { status: 201 });

    } catch (e) {
        console.error("POST Payment Error:", e);
        return Response.json({
            error: true,
            message: e.message || "Failed to record payment"
        }, { status: 500 });
    }
}
