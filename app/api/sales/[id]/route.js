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
        "brokers.name as broker_name",
        "loose_diamond_sales.payment_mode",
        "loose_diamond_sales.invoice_number",
        "loose_diamond_sales.sold_carats as loose_sold_carats",
        "loose_diamond_sales.sale_amount as loose_sale_amount"
      )
      .leftJoin("clients", "sales.client_id", "clients.id")
      .leftJoin("diamonds", "sales.diamond_id", "diamonds.id")
      .leftJoin("loose_diamond_items", "sales.loose_diamond_item_id", "loose_diamond_items.id")
      .leftJoin("loose_diamond", "loose_diamond_items.loose_diamond_id", "loose_diamond.id")
      .leftJoin("brokers", "sales.broker_id", "brokers.id")
      .leftJoin("loose_diamond_sales", "sales.id", "loose_diamond_sales.sale_id")
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
      // Prioritize loose table fields if they exist
      sold_carats: sale.loose_diamond_item_id ? (sale.loose_sold_carats ?? sale.sold_carats) : sale.sold_carats,
      sale_amount: sale.loose_diamond_item_id ? (sale.loose_sale_amount ?? sale.sale_amount) : sale.sale_amount,
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
      "payment_mode",
      "invoice_number",
    ];

    for (const field of allowedFields) {
      if (body.hasOwnProperty(field)) {
        updateData[field] = body[field];
      }
    }

    // Duplicate Invoice Check for Loose Sales
    if (existing.loose_diamond_item_id && body.invoice_number && body.payment_mode !== 'Export') {
      const existingInvoice = await knex("loose_diamond_sales")
        .where("invoice_number", body.invoice_number)
        .whereNot("sale_id", id)
        .first();
      
      if (existingInvoice) {
        return new Response(
          JSON.stringify({ error: `Invoice number ${body.invoice_number} already exists. Please choose the next number.` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    await knex("sales").where("id", id).update(updateData);

    // Update loose_diamond_sales if it exists for this sale
    if (existing.loose_diamond_item_id) {
      // Fetch the CURRENT state BEFORE updating (for inventory diff calculation)
      const oldLooseSale = await knex("loose_diamond_sales").where("sale_id", id).first();

      // Only update the fields that actually exist in the loose_diamond_sales table
      const looseUpdate = { updated_at: new Date() };
      if (body.hasOwnProperty('sold_carats')) looseUpdate.sold_carats = body.sold_carats;
      if (body.hasOwnProperty('payment_mode')) looseUpdate.payment_mode = body.payment_mode;
      if (body.hasOwnProperty('invoice_number')) looseUpdate.invoice_number = body.invoice_number;
      if (body.hasOwnProperty('sale_amount')) looseUpdate.sale_amount = body.sale_amount;

      await knex("loose_diamond_sales")
        .where("sale_id", id)
        .update(looseUpdate);

      // Re-adjust lot inventory if sold_carats changed
      if (body.hasOwnProperty('sold_carats')) {
        const oldSoldCarats = parseFloat(oldLooseSale?.sold_carats) || 0;
        const newSoldCarats = parseFloat(body.sold_carats) || 0;
        const diff = newSoldCarats - oldSoldCarats;

        if (diff !== 0) {
          // decrement means: if sold more, reduce lot; if sold less, restore lot
          await knex("loose_diamond_items")
            .where("id", existing.loose_diamond_item_id)
            .decrement("carats", diff);
        }
      }
    }
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