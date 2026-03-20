import knex from "../../lib/db";
import { cookies } from "next/headers";
import { verifyToken, getUser } from "../../lib/services/authService";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const paymentStatus = url.searchParams.get("payment_status");

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let user = null;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) user = await getUser(decoded.id);
    }

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
        "loose_diamond.lot_number as loose_lot_number",
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
      .orderBy("sales.id", "desc");

    // Filter by sale status
    if (status) {
      query = query.where("sales.status", status);
    }

    // Filter by client type
    if (user) {
      if (user.client_type === "Loose") {
        query = query.whereNotNull("sales.loose_diamond_item_id");
      } else if (user.client_type === "GIA") {
        query = query.whereNotNull("sales.diamond_id");
      }
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

    // Get payment totals for each sale
    const salesWithPayments = [];

    let paymentsBySale = {};
    if (rows.length > 0) {
      const saleIds = rows.map((r) => r.id);
      try {
        const paymentsArray = await knex("sale_payments")
          .whereIn("sale_id", saleIds)
          .select("sale_id")
          .sum("payment_amount_done as total")
          .groupBy("sale_id");

        paymentsBySale = paymentsArray.reduce((acc, curr) => {
          acc[curr.sale_id] = parseFloat(curr.total) || 0;
          return acc;
        }, {});
      } catch (e) {
        console.log("sale_payments table error:", e.message);
      }
    }

    for (const sale of rows) {
      const totalPaymentsInr = paymentsBySale[sale.id] || 0;

      // Advance amount is stored in INR (in sales table)
      const advanceAmountInr = parseFloat(sale.advance_amount) || 0;

      // Total received = advance + all payment installments
      // But advance is already recorded in sale_payments as first payment
      // So we just use totalPaymentsInr which includes advance
      const totalReceivedInr = totalPaymentsInr;

      // If no payments recorded but advance exists, use advance
      const finalReceivedInr = totalReceivedInr > 0 ? totalReceivedInr : advanceAmountInr;

      // Sale amount in INR for outstanding calculation
      const saleAmountInr = parseFloat(sale.sale_amount_inr) || 0;
      const outstandingInr = Math.max(0, saleAmountInr - finalReceivedInr);

      salesWithPayments.push({
        ...sale,
        // INR fields for payment tracking
        total_received_inr: finalReceivedInr,
        outstanding_inr: outstandingInr,
        advance_amount_inr: advanceAmountInr,
        // Legacy field for backward compatibility
        total_received: finalReceivedInr,
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
      loose_diamond_item_id,
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

    // Strict client-type validation
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return new Response("Unauthorized", { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return new Response("Unauthorized", { status: 401 });
    const user = await getUser(decoded.id);

    if (user.client_type === "Loose" && diamond_id) {
      return new Response(
        JSON.stringify({ error: "Loose clients can only sell Lot items" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (user.client_type === "GIA" && loose_diamond_item_id) {
      return new Response(
        JSON.stringify({ error: "GIA clients can only sell GIA diamonds" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if ((!diamond_id && !loose_diamond_item_id) || !client_id) {
      return new Response(
        JSON.stringify({ error: "Item and Client are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare insert data
    const insertData = {
      diamond_id: diamond_id || null,
      loose_diamond_item_id: loose_diamond_item_id || null,
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
      // Payment fields - advance_amount is stored in INR
      selling_date: selling_date || new Date().toISOString().split("T")[0],
      payment_status: payment_status || "on_terms",
      terms_days: terms_days || 30,
      advance_amount: advance_amount || 0, // Stored in INR
      due_date: due_date || null,
    };

    console.log("Inserting sale with data:", insertData);

    // Insert sale
    const [id] = await knex("sales").insert(insertData);

    // Update item availability
    if (diamond_id) {
        await knex("diamonds")
          .where("id", diamond_id)
          .update({ availability: "sold", updated_at: new Date() });
    }
    // Note: loose_diamond_items doesn't currently have availability status column
    // but we could mark the parent lot as sold if all items are sold in future.

    // If there's an advance amount, create initial payment record (in INR)
    if (advance_amount && parseFloat(advance_amount) > 0) {
      try {
        await knex("sale_payments").insert({
          sale_id: id,
          payment_amount_done: advance_amount, // Amount in INR
          payment_date: selling_date || new Date(),
          payment_method: "advance",
          notes: "Initial advance payment",
          created_at: new Date(),
        });
      } catch (e) {
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