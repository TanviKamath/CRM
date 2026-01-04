import knex from "../../../lib/db";
import { brokerSchema } from "../../../lib/validators/brokerSchema";

export async function GET(req, { params }) {
  try {
    const broker = await knex("brokers").where({ id: params.id }).first();
    if (!broker) return new Response("Not found", { status: 404 });

    // MySQL auto-parses JSON columns, so reference is already an object

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

    // MySQL auto-parses JSON columns, so reference is already an object

    return Response.json(updated);
  } catch (e) {
    console.error("Error updating broker:", e);

    // Handle different error types
    let errorMessage = "Failed to update broker";
    if (e.name === "ZodError") {
      errorMessage = e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(", ");
    } else if (typeof e === 'string') {
      errorMessage = e;
    } else if (e && typeof e.message === 'string') {
      errorMessage = e.message;
    } else if (e && typeof e.toString === 'function') {
      errorMessage = e.toString();
    }

    return new Response(errorMessage, { status: 400 });
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
