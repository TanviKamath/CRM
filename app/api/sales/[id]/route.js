// app/api/sales/[id]/route.js
import knex from "../../../lib/db";

// GET single sale
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const sale = await knex("sales")
      .select(
        "sales.*",
        "clients.company_name as client_company",
        "clients.contact_name as client_contact",
        "diamonds.certificate_number as diamond_certificate",
        "diamonds.shape as diamond_shape",
        "diamonds.weight as diamond_weight",
        "diamonds.color as diamond_color",
        "diamonds.clarity as diamond_clarity",
        "loose_diamond.lot_number as loose_lot_number",
        "loose_diamond_items.loose_diamond_id as loose_diamond_id",
        "loose_diamond_items.color_category as loose_color_category",
        "loose_diamond_items.size_category as loose_size_category",
        "loose_diamond_items.grade as loose_grade",
        "loose_diamond_items.carats as loose_carats",
        "brokers.name as broker_name"
      )
      .leftJoin("clients", "sales.client_id", "clients.id")
      .leftJoin("diamonds", "sales.diamond_id", "diamonds.id")
      .leftJoin("loose_diamond_items", "sales.loose_diamond_item_id", "loose_diamond_items.id")
      .leftJoin("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .leftJoin("brokers", "sales.broker_id", "brokers.id")
      .where("sales.id", id)
      .first();

    if (!sale) {
      return new Response(
        JSON.stringify({ error: "Sale not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try to get payment totals
    let totalPayments = 0;
    try {
      const paymentResult = await knex("sale_payments")
        .where("sale_id", id)
        .sum("payment_amount_done as total")
        .first();
      totalPayments = parseFloat(paymentResult?.total) || 0;
    } catch (e) {
      // Table might not exist
    }

    const advanceAmount = parseFloat(sale.advance_amount) || 0;
    const totalReceived = advanceAmount + totalPayments;

    // In the response object, add broker:
    const response = {
      ...sale,
      total_received: totalReceived,
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
        loose_diamond_id: sale.loose_diamond_id,
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
      },
      broker: {
        id: sale.broker_id,
        name: sale.broker_name,
      },
    };

    return Response.json(response, { status: 200 });
  } catch (e) {
    console.error("Error fetching sale:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT update sale
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Check if sale exists
    const existing = await knex("sales").where("id", id).first();
    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Sale not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare update data
    const updateData = { updated_at: new Date() };

    const allowedFields = [
      "diamond_id",
      "loose_diamond_item_id",
      "client_id",
      "broker_id",
      "status",
      "sale_rap_discount",
      "sale_amount",
      "conversion_rate",
      "sale_amount_inr",
      "brokerage_rate",
      "brokerage_amount",
      "notes",
      "selling_date",
      "payment_status",
      "terms_days",
      "advance_amount",
      "due_date",
    ];

    for (const field of allowedFields) {
      if (body.hasOwnProperty(field)) {
        updateData[field] = body[field];
      }
    }

    await knex("sales").where("id", id).update(updateData);
    const updated = await knex("sales").where("id", id).first();

    return Response.json(updated, { status: 200 });
  } catch (e) {
    console.error("Error updating sale:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE sale
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const sale = await knex("sales").where("id", id).first();

    if (!sale) {
      return new Response(
        JSON.stringify({ error: "Sale not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete payments first (if table exists)
    try {
      await knex("sale_payments").where("sale_id", id).del();
    } catch (e) {
      // Table might not exist
    }

    // Delete sale
    await knex("sales").where("id", id).del();

    // Restore diamond availability
    if (sale.diamond_id) {
      await knex("diamonds")
        .where("id", sale.diamond_id)
        .update({ availability: "available", updated_at: new Date() });
    }

    return Response.json({ message: "Sale deleted successfully" }, { status: 200 });
  } catch (e) {
    console.error("Error deleting sale:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}