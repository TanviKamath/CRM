import knex from "../../lib/db";
import { brokerSchema } from "../../lib/validators/brokerSchema";

export async function GET() {
  try {
    const brokers = await knex("brokers").orderBy("id", "desc");
    // MySQL auto-parses JSON columns, so reference is already an object
    return Response.json(brokers);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = brokerSchema.parse(body);

    const [id] = await knex("brokers").insert(parsed);
    const created = await knex("brokers").where({ id }).first();

    // MySQL auto-parses JSON columns, so reference is already an object

    return Response.json(created, { status: 201 });
  } catch (e) {
    console.error("Error creating broker:", e);

    // Handle different error types
    let errorMessage = "Failed to create broker";
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
