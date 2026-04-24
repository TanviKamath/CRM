// app/api/loose-diamonds/[id]/payment/route.js
import { cookies } from "next/headers";
import { verifyToken } from "../../../../lib/services/authService";
import db from "../../../../lib/db";

// GET - Fetch payment details for a lot
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const lot = await db("loose_diamond")
      .where({ id, user_id: decoded.id })
      .first();

    if (!lot) return new Response("Lot not found", { status: 404 });

    const payments = await db("lot_payments")
      .where("lot_id", id)
      .orderBy("payment_date", "desc")
      .orderBy("created_at", "desc");

    const totalPaidInr = payments.reduce((sum, p) => sum + parseFloat(p.payment_amount_done || 0), 0);
    const purchaseAmountInr = parseFloat(lot.total_purchase_value) || 0;
    const outstandingInr = Math.max(0, purchaseAmountInr - totalPaidInr);

    return Response.json({
      lot_id: lot.id,
      lot_number: lot.lot_number,
      supplier_name: lot.supplier_name,
      total_carats: lot.total_carats,
      purchase_amount_inr: purchaseAmountInr,
      purchase_date: lot.purchase_date,
      due_date: lot.due_date,
      status: lot.status,
      payment_status: lot.payment_status || "on_terms",
      total_paid_inr: totalPaidInr,
      outstanding_inr: outstandingInr,
      payments: payments,
    });
  } catch (e) {
    console.error("Error fetching lot payment details:", e);
    return Response.json({ message: "Failed to fetch payment details" }, { status: 500 });
  }
}

// POST - Record a new payment (in INR)
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { amount, payment_date, payment_method, reference, notes } = body;

    if (!amount || parseFloat(amount) <= 0) {
      return Response.json({ message: "Invalid payment amount" }, { status: 400 });
    }

    const lot = await db("loose_diamond").where({ id, user_id: decoded.id }).first();
    if (!lot) {
      return Response.json({ message: "Lot not found" }, { status: 404 });
    }

    const purchaseAmountInr = parseFloat(lot.total_purchase_value) || 0;

    const [paymentResult] = await db("lot_payments")
      .where("lot_id", id)
      .sum("payment_amount_done as total");

    const totalPaidInr = parseFloat(paymentResult?.total) || 0;
    const currentOutstandingInr = purchaseAmountInr - totalPaidInr;

    if (parseFloat(amount) > currentOutstandingInr + 0.01) {
      return Response.json(
        { message: `Payment amount exceeds outstanding balance of $${currentOutstandingInr.toFixed(2)}` },
        { status: 400 }
      );
    }

    const [paymentId] = await db("lot_payments").insert({
      lot_id: id,
      payment_amount_done: amount,
      payment_date: payment_date || new Date(),
      payment_method: payment_method || null,
      reference: reference || null,
      notes: notes || null,
      created_at: new Date(),
    });

    const newOutstandingInr = currentOutstandingInr - parseFloat(amount);
    let newPaymentStatus = lot.payment_status;
    if (newOutstandingInr <= 0.01) {
      newPaymentStatus = "completed";
    } else if (totalPaidInr + parseFloat(amount) > 0) {
      newPaymentStatus = "partial";
    }

    await db("loose_diamond")
      .where("id", id)
      .update({ payment_status: newPaymentStatus, updated_at: new Date() });

    return Response.json({
      message: "Payment recorded successfully",
      payment_id: paymentId,
      new_outstanding_inr: newOutstandingInr,
      payment_status: newPaymentStatus,
    });
  } catch (e) {
    console.error("Error recording payment:", e);
    return Response.json({ message: "Failed to record payment: " + e.message }, { status: 500 });
  }
}
