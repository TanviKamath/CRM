// app/api/sales/[id]/payment/route.js
import knex from "../../../../lib/db";

// GET - Fetch payment details for a sale
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // Get sale details with related data
    const sale = await knex("sales")
      .select(
        "sales.*",
        "diamonds.certificate_number as diamond_certificate",
        "diamonds.shape as diamond_shape",
        "diamonds.weight as diamond_weight",
        "diamonds.color as diamond_color",
        "diamonds.clarity as diamond_clarity",
        "loose_diamond.lot_number as loose_lot_number",
        "loose_diamond_items.color_category as loose_color_category",
        "loose_diamond_items.size_category as loose_size_category",
        "loose_diamond_items.grade as loose_grade",
        "loose_diamond_items.carats as loose_carats",
        "clients.company_name as client_company",
        "clients.contact_name as client_contact",
        "clients.email as client_email"
      )
      .leftJoin("diamonds", "sales.diamond_id", "diamonds.id")
      .leftJoin("loose_diamond_items", "sales.loose_diamond_item_id", "loose_diamond_items.id")
      .leftJoin("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .leftJoin("clients", "sales.client_id", "clients.id")
      .where("sales.id", id)
      .first();

    if (!sale) {
      return Response.json({ message: "Sale not found" }, { status: 404 });
    }

    // Get all payments for this sale (all stored in INR)
    const payments = await knex("sale_payments")
      .where("sale_id", id)
      .orderBy("payment_date", "desc")
      .orderBy("created_at", "desc");

    // Calculate totals in INR
    const advanceAmountInr = parseFloat(sale.advance_amount) || 0;

    // Sum all payments (includes advance if recorded as payment)
    const paymentsTotalInr = payments.reduce(
      (sum, p) => sum + parseFloat(p.payment_amount_done || 0),
      0
    );

    // Total received is sum of all payments
    // Advance is already included in payments table
    const totalReceivedInr = paymentsTotalInr;

    // If no payments but advance exists in sales table, use that
    const finalReceivedInr = totalReceivedInr > 0 ? totalReceivedInr : advanceAmountInr;

    const saleAmountInr = parseFloat(sale.sale_amount_inr) || 0;
    const outstandingInr = Math.max(0, saleAmountInr - finalReceivedInr);

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
      sale_amount_inr: saleAmountInr,
      selling_date: sale.selling_date,
      terms_days: sale.terms_days || 30,
      due_date: dueDate,
      status: sale.status,
      payment_status: sale.payment_status || "on_terms",
      // INR values
      advance_amount_inr: advanceAmountInr,
      total_received_inr: finalReceivedInr,
      outstanding_inr: outstandingInr,
      diamond: sale.diamond_id ? {
        id: sale.diamond_id,
        certificate_number: sale.diamond_certificate,
        shape: sale.diamond_shape,
        weight: sale.diamond_weight,
        color: sale.diamond_color,
        clarity: sale.diamond_clarity,
      } : null,
      loose_item: sale.loose_diamond_item_id ? {
        id: sale.loose_diamond_item_id,
        lot_number: sale.loose_lot_number,
        color_category: sale.loose_color_category,
        size_category: sale.loose_size_category,
        grade: sale.loose_grade,
        carats: sale.loose_carats,
      } : null,
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

// POST - Record a new payment (in INR)
export async function POST(req, { params }) {
  try {
    const { id } = await params;
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

    const saleAmountInr = parseFloat(sale.sale_amount_inr) || 0;
    const advanceAmountInr = parseFloat(sale.advance_amount) || 0;

    // Get existing payments total (all in INR)
    const [paymentResult] = await knex("sale_payments")
      .where("sale_id", id)
      .sum("payment_amount_done as total");

    const paymentsTotalInr = parseFloat(paymentResult?.total) || 0;

    // If payments exist, use that total; otherwise use advance from sales table
    const totalReceivedInr = paymentsTotalInr > 0 ? paymentsTotalInr : advanceAmountInr;
    const currentOutstandingInr = saleAmountInr - totalReceivedInr;

    // Validate payment doesn't exceed outstanding
    if (parseFloat(amount) > currentOutstandingInr + 0.01) {
      return Response.json(
        { message: `Payment amount exceeds outstanding balance of ₹${currentOutstandingInr.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Insert payment record (amount is in INR)
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
    const newOutstandingInr = currentOutstandingInr - parseFloat(amount);

    // Update sale payment status
    let newPaymentStatus = sale.payment_status;
    if (newOutstandingInr <= 0.01) {
      newPaymentStatus = "completed";
    } else if (totalReceivedInr + parseFloat(amount) > 0) {
      newPaymentStatus = "partial";
    }

    await knex("sales")
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