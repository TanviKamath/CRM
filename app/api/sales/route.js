// app/api/sales/route.js
import knex from "../../lib/db";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("payment_status");

    let query = knex("sales")
      .select(
        "sales.*",
        "clients.company_name as client_company",
        "clients.contact_name as client_contact",
        "diamonds.certificate_number as diamond_certificate",
        "diamonds.shape as diamond_shape",
        "diamonds.weight as diamond_weight",
        "diamonds.color as diamond_color",
        "diamonds.clarity as diamond_clarity",
        "brokers.name as broker_name"
      )
      .leftJoin("clients", "sales.client_id", "clients.id")
      .leftJoin("diamonds", "sales.diamond_id", "diamonds.id")
      .leftJoin("brokers", "sales.broker_id", "brokers.id")
      .orderBy("sales.id", "desc");

    // Filter by sale status
    if (status) {
      query = query.where("sales.status", status);
    }

    // Filter by payment status
    if (paymentStatus) {
      if (paymentStatus === "completed" || paymentStatus === "paid") {
        query = query.where("sales.payment_status", "completed");
      } else if (paymentStatus === "partial") {
        query = query.where("sales.payment_status", "partial");
      } else if (paymentStatus === "on_terms" || paymentStatus === "pending") {
        query = query.where(function () {
          this.where("sales.payment_status", "on_terms")
            .orWhere("sales.payment_status", "pending")
            .orWhereNull("sales.payment_status");
        });
      }
    }

    const rows = await query;

    // Check if sale_payments table exists
    let paymentsTableExists = true;
    try {
      await knex.schema.hasTable("sale_payments");
    } catch (e) {
      paymentsTableExists = false;
    }

    // Get payment totals for each sale
    const salesWithPayments = [];
    
    for (const sale of rows) {
      let totalPayments = 0;
      
      // Only try to get payments if table exists
      if (paymentsTableExists) {
        try {
          const paymentResult = await knex("sale_payments")
            .where("sale_id", sale.id)
            .sum("payment_amount_done as total")
            .first();
          
          totalPayments = parseFloat(paymentResult?.total) || 0;
        } catch (e) {
          // Table might not exist yet, continue without payments
          console.log("sale_payments table not found, skipping payment totals");
        }
      }

      const advanceAmount = parseFloat(sale.advance_amount) || 0;
      const totalReceived = advanceAmount + totalPayments;

      salesWithPayments.push({
        ...sale,
        total_received: totalReceived,
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
        },
      });
    }

    const totalCount = await knex("sales").count("* as count").first();

    return Response.json(
      { data: salesWithPayments, total: Number(totalCount?.count || 0) },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching sales:", e);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      diamond_id,
      client_id,
      broker_id,
      status,
      sale_rap_discount,
      sale_amount,
      conversion_rate,
      sale_amount_inr,
      brokerage_rate,
      brokerage_amount,
      notes,
      selling_date,
      payment_status,
      terms_days,
      advance_amount,
      due_date,
    } = body;

    // Validate required fields
    if (!diamond_id || !client_id) {
      return new Response(
        JSON.stringify({ error: "Diamond and Client are required" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare insert data
    const insertData = {
      diamond_id,
      client_id,
      broker_id: broker_id || null,
      status: status || "pending",
      sale_rap_discount: sale_rap_discount || 0,
      sale_amount: sale_amount || 0,
      conversion_rate: conversion_rate || null,
      sale_amount_inr: sale_amount_inr || null,
      brokerage_rate: brokerage_rate || null,
      brokerage_amount: brokerage_amount || null,
      notes: notes || null,
      created_at: new Date(),
    };

    // Add optional payment fields if they exist in schema
    try {
      // Check if columns exist before adding them
      const hasSellingDate = await knex.schema.hasColumn("sales", "selling_date");
      if (hasSellingDate) {
        insertData.selling_date = selling_date || new Date().toISOString().split("T")[0];
        insertData.payment_status = payment_status || "on_terms";
        insertData.terms_days = terms_days || 30;
        insertData.advance_amount = advance_amount || 0;
        insertData.due_date = due_date || null;
      }
    } catch (e) {
      // Columns don't exist, continue without them
      console.log("Payment columns not found, skipping");
    }

    // Insert sale
    const [id] = await knex("sales").insert(insertData);

    // Update diamond availability to 'sold'
    await knex("diamonds")
      .where("id", diamond_id)
      .update({ availability: "sold", updated_at: new Date() });

    // If there's an advance amount, create initial payment record
    if (advance_amount && parseFloat(advance_amount) > 0) {
      try {
        await knex("sale_payments").insert({
          sale_id: id,
          payment_amount_done: advance_amount,
          payment_date: selling_date || new Date(),
          payment_method: "advance",
          notes: "Initial advance payment",
          created_at: new Date(),
        });
      } catch (e) {
        // sale_payments table might not exist
        console.log("Could not create advance payment record:", e.message);
      }
    }

    const created = await knex("sales").where({ id }).first();

    return Response.json(created, { status: 201 });
  } catch (e) {
    console.error("Error creating sale:", e);
    return new Response(
      JSON.stringify({ error: e.message }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}