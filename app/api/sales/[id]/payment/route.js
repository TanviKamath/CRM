// app/api/sales/[id]/payment/route.js
import knex from "../../../../lib/db";

// GET - Fetch payment details for a sale
export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Get sale details with related data
    const sale = await knex("sales")
      .select(
        "sales.*",
        "diamonds.certificate_number as diamond_certificate",
        "diamonds.shape as diamond_shape",
        "diamonds.weight as diamond_weight",
        "diamonds.color as diamond_color",
        "diamonds.clarity as diamond_clarity",
        "clients.company_name as client_company",
        "clients.contact_name as client_contact",
        "clients.email as client_email"
      )
      .leftJoin("diamonds", "sales.diamond_id", "diamonds.id")
      .leftJoin("clients", "sales.client_id", "clients.id")
      .where("sales.id", id)
      .first();

    if (!sale) {
      return Response.json({ message: "Sale not found" }, { status: 404 });
    }

    // Get all payments for this sale
    const payments = await knex("sale_payments")
      .where("sale_id", id)
      .orderBy("payment_date", "desc")
      .orderBy("created_at", "desc");

    // Calculate totals
    const advanceAmount = parseFloat(sale.advance_amount) || 0;
    const paymentsTotal = payments.reduce(
      (sum, p) => sum + parseFloat(p.payment_amount_done || 0),
      0
    );
    const totalReceived = advanceAmount + paymentsTotal;
    const saleAmount = parseFloat(sale.sale_amount) || 0;
    const outstanding = Math.max(0, saleAmount - totalReceived);

    // Calculate due date if not set
    let dueDate = sale.due_date;
    if (!dueDate && sale.selling_date && sale.terms_days) {
      const startDate = new Date(sale.selling_date);
      dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (parseInt(sale.terms_days) || 30));
    }

    return Response.json({
      sale_id: sale.id,
      sale_amount: sale.sale_amount,
      sale_amount_inr: sale.sale_amount_inr,
      selling_date: sale.selling_date,
      terms_days: sale.terms_days || 30,
      due_date: dueDate,
      status: sale.status,
      payment_status: sale.payment_status || "on_terms",
      advance_amount: advanceAmount,
      total_received: totalReceived,
      outstanding: outstanding,
      diamond: {
        id: sale.diamond_id,
        certificate_number: sale.diamond_certificate,
        shape: sale.diamond_shape,
        weight: sale.diamond_weight,
        color: sale.diamond_color,
        clarity: sale.diamond_clarity,
      },
      client: {
        id: sale.client_id,
        company_name: sale.client_company,
        contact_name: sale.client_contact,
        email: sale.client_email,
      },
      payments: payments,
    });
  } catch (e) {
    console.error("Error fetching sale payment details:", e);
    return Response.json({ message: "Failed to fetch payment details" }, { status: 500 });
  }
}

// POST - Record a new payment
export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { amount, payment_date, payment_method, reference, notes } = body;

    if (!amount || parseFloat(amount) <= 0) {
      return Response.json({ message: "Invalid payment amount" }, { status: 400 });
    }

    // Verify sale exists and get current data
    const sale = await knex("sales").where("id", id).first();
    if (!sale) {
      return Response.json({ message: "Sale not found" }, { status: 404 });
    }

    const saleAmount = parseFloat(sale.sale_amount) || 0;
    const advanceAmount = parseFloat(sale.advance_amount) || 0;

    // Get existing payments total
    const [paymentResult] = await knex("sale_payments")
      .where("sale_id", id)
      .sum("payment_amount_done as total");

    const paymentsTotal = parseFloat(paymentResult?.total) || 0;
    const totalReceived = advanceAmount + paymentsTotal;
    const currentOutstanding = saleAmount - totalReceived;

    // Validate payment doesn't exceed outstanding
    if (parseFloat(amount) > currentOutstanding + 0.01) {
      return Response.json(
        { message: `Payment amount exceeds outstanding balance of $${currentOutstanding.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Insert payment record
    const [paymentId] = await knex("sale_payments").insert({
      sale_id: id,
      payment_amount_done: amount,
      payment_date: payment_date || new Date(),
      payment_method: payment_method || null,
      reference: reference || null,
      notes: notes || null,
      created_at: new Date(),
    });

    // Calculate new outstanding
    const newOutstanding = currentOutstanding - parseFloat(amount);

    // Update sale payment status
    let newPaymentStatus = sale.payment_status;
    if (newOutstanding <= 0.01) {
      newPaymentStatus = "completed";
    } else if (totalReceived + parseFloat(amount) > advanceAmount) {
      newPaymentStatus = "partial";
    }

    await knex("sales")
      .where("id", id)
      .update({ payment_status: newPaymentStatus, updated_at: new Date() });

    return Response.json({
      message: "Payment recorded successfully",
      payment_id: paymentId,
      new_outstanding: newOutstanding,
      payment_status: newPaymentStatus,
    });
  } catch (e) {
    console.error("Error recording payment:", e);
    return Response.json({ message: "Failed to record payment: " + e.message }, { status: 500 });
  }
}