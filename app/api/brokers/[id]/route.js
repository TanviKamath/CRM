import knex from "../../../lib/db";
import { brokerSchema } from "../../../lib/validators/brokerSchema";

export async function GET(req, { params }) {
  try {
    const broker = await knex("brokers").where({ id: params.id }).first();
    if (!broker) return new Response("Not found", { status: 404 });

    return Response.json(broker);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const parsed = brokerSchema.parse(body);

    await knex("brokers").where({ id: params.id }).update(parsed);
    const updated = await knex("brokers").where({ id: params.id }).first();

    return Response.json(updated);
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await knex("brokers").where({ id: params.id }).del();
    return Response.json({ message: "Deleted" });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
