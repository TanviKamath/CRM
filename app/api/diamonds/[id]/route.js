// app/api/diamonds/[id]/route.js
import knex from "../../../lib/db";
import { z } from "zod";

const diamondSchema = z.object({
  certificate_number: z.string().min(1),
  shape: z.string().min(1),
  weight: z.preprocess((v) => Number(v), z.number().positive()),
  color: z.string().min(1),
  clarity: z.string().min(1),
  cut: z.string().min(1),
  availability: z.string().optional(),
  // add more fields if needed...
});

export async function GET(req, { params }) {
  try {
    const diamond = await knex("diamonds").where({ id: params.id }).first();
    if (!diamond) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify(diamond), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const parsed = diamondSchema.parse(body);

    await knex("diamonds").where({ id: params.id }).update(parsed);
    const updated = await knex("diamonds").where({ id: params.id }).first();

    return new Response(JSON.stringify(updated), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (e) {
    const msg = e.errors ? JSON.stringify(e.errors) : (e.message || "Bad request");
    return new Response(msg, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await knex("diamonds").where({ id: params.id }).del();
    return new Response(JSON.stringify({ message: "Deleted" }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
