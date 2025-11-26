import knex from "../../lib/db";
import { brokerSchema } from "../../lib/validators/brokerSchema";

export async function GET() {
  try {
    const brokers = await knex("brokers").orderBy("id", "desc");
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

    return Response.json(created, { status: 201 });
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}
