import knex from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const purchasePayments = await knex("payment_outstanding")
            .select("diamond_id", "payment_amount_done", "created_at");

        return NextResponse.json(purchasePayments);
    } catch (err) {
        console.error("Error fetching purchase payments:", err);
        return NextResponse.json({ error: "Failed to fetch purchase payments" }, { status: 500 });
    }
}
