// app/api/diamonds/route.js
import knex from "../../lib/db";
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

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const availability = url.searchParams.get("availability") || "";

    let q = knex("diamonds").select("*").orderBy("id", "desc");
    if (availability) q = q.where("availability", availability);

    const rows = await q;
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = diamondSchema.parse(body);

    const [id] = await knex("diamonds").insert(parsed);
    const created = await knex("diamonds").where({ id }).first();

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e.errors ? JSON.stringify(e.errors) : (e.message || "Bad request");
    return new Response(msg, { status: 400 });
  }
}
