import knex from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const salePayments = await knex("sale_payments")
            .select("sale_id", "payment_amount_done", "payment_date", "payment_method");

        return NextResponse.json(salePayments);
    } catch (err) {
        console.error("Error fetching sale payments:", err);
        return NextResponse.json({ error: "Failed to fetch sale payments" }, { status: 500 });
    }
}
