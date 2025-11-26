import knex from "../../lib/db";
import { clientSchema } from "../../lib/validators/clientSchema";

export async function GET() {
  try {
    const clients = await knex("clients").orderBy("id", "desc");
    return Response.json(clients);
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = clientSchema.parse(body);

    const [id] = await knex("clients").insert(parsed);
    const created = await knex("clients").where({ id }).first();

    return Response.json(created, { status: 201 });
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}
