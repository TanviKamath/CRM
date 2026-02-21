// app/api/expenses/[id]/route.js
import knex from "../../../lib/db";
import { z } from "zod";

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

// GET - Get single expense
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const expense = await knex("expenses").where({ id }).first();

    if (!expense) {
      return new Response("Expense not found", { status: 404 });
    }

    return new Response(JSON.stringify(expense), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GET Error:", e);
    return new Response(e.message, { status: 500 });
  }
}

// PUT - Update expense
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = expenseSchema.parse(body);

    await knex("expenses").where({ id }).update({
      expense_date: parsed.expense_date,
      category: parsed.category,
      description: parsed.description,
      amount: parsed.amount,
      payment_method: parsed.payment_method || null,
      reference_number: parsed.reference_number || null,
      paid_to: parsed.paid_to || null,
      notes: parsed.notes || null,
      updated_at: new Date(),
    });

    const updated = await knex("expenses").where({ id }).first();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("PUT Error:", e);
    const msg = e.errors ? JSON.stringify(e.errors) : e.message;
    return new Response(msg, { status: 400 });
  }
}

// DELETE - Delete expense
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    await knex("expenses").where({ id }).delete();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("DELETE Error:", e);
    return new Response(e.message, { status: 500 });
  }
}