import knex from "../../../lib/db";
import { saleSchema } from "../../../lib/validators/saleSchema";

export async function GET(req, { params }) {
  try {
    const sale = await knex("sales").where({ id: params.id }).first();
    if (!sale) return new Response("Not Found", { status: 404 });

    return Response.json(sale);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const parsed = saleSchema.parse(body);

    await knex("sales").where({ id: params.id }).update(parsed);
    const updated = await knex("sales").where({ id: params.id }).first();

    return Response.json(updated);
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await knex("sales").where({ id: params.id }).del();
    return Response.json({ message: "Deleted" });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
