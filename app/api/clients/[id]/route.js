import knex from "../../../lib/db";
import { clientSchema } from "../../../lib/validators/clientSchema";

export async function GET(req, { params }) {
  try {
    const client = await knex("clients").where({ id: params.id }).first();
    if (!client) return new Response("Not found", { status: 404 });

    return Response.json(client);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const parsed = clientSchema.parse(body);

    await knex("clients").where({ id: params.id }).update(parsed);
    const updated = await knex("clients").where({ id: params.id }).first();

    return Response.json(updated);
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await knex("clients").where({ id: params.id }).del();
    return Response.json({ message: "Deleted" });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
