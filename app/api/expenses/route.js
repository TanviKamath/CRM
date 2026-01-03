// app/api/expenses/route.js
import knex from "../../lib/db";
import { z } from "zod";

// Validation schema
const expenseSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.preprocess((v) => parseFloat(v) || 0, z.number().positive("Amount must be positive")),
  payment_method: z.string().optional().nullable(),
  reference_number: z.string().optional().nullable(),
  paid_to: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET - List all expenses
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "";
    const startDate = url.searchParams.get("start_date") || "";
    const endDate = url.searchParams.get("end_date") || "";
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    // Build query
    let query = knex("expenses");
    let countQuery = knex("expenses");

    // Apply filters
    if (category) {
      query = query.where("category", category);
      countQuery = countQuery.where("category", category);
    }

    if (startDate) {
      query = query.where("expense_date", ">=", startDate);
      countQuery = countQuery.where("expense_date", ">=", startDate);
    }

    if (endDate) {
      query = query.where("expense_date", "<=", endDate);
      countQuery = countQuery.where("expense_date", "<=", endDate);
    }

    // Get total count
    const [{ count: total }] = await countQuery.count("id as count");

    // Get total amount
    const [{ sum: totalAmount }] = await knex("expenses")
      .where((builder) => {
        if (category) builder.where("category", category);
        if (startDate) builder.where("expense_date", ">=", startDate);
        if (endDate) builder.where("expense_date", "<=", endDate);
      })
      .sum("amount as sum");

    // Get paginated results
    const rows = await query
      .select("*")
      .orderBy("expense_date", "desc")
      .orderBy("id", "desc")
      .limit(limit)
      .offset(offset);

    const response = {
      data: rows,
      total: parseInt(total),
      totalAmount: parseFloat(totalAmount) || 0,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET Error:", e);
    return new Response(e.message, { status: 500 });
  }
}

// POST - Create new expense
export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = expenseSchema.parse(body);

    const insertData = {
      expense_date: parsed.expense_date,
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount,
      payment_method: parsed.payment_method || null,
      reference_number: parsed.reference_number || null,
      paid_to: parsed.paid_to || null,
      notes: parsed.notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [id] = await knex("expenses").insert(insertData);
    const created = await knex("expenses").where({ id }).first();

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("POST Error:", e);
    const msg = e.errors ? JSON.stringify(e.errors) : e.message;
    return new Response(msg, { status: 400 });
  }
}