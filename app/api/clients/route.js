import knex from "../../lib/db";
import { createClientService } from "../../lib/services/clientService";
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
    console.log("Creating client with body:", body);
    const result = await createClientService(body);

    return Response.json(result.client, { status: 201 });
  } catch (e) {
    console.error("Error creating client:", e);
    return new Response(e.message, { status: 400 });
  }
}
