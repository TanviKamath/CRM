import knex from ".././../lib/db";
import { saleSchema } from "../../lib/validators/saleSchema";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let query = knex("sales")
      .select(
        "sales.*",
        "clients.company_name as client_company",
        "diamonds.certificate_number as diamond_certificate",
        "brokers.name as broker_name"
      )
      .leftJoin("clients", "sales.client_id", "clients.id")
      .leftJoin("diamonds", "sales.diamond_id", "diamonds.id")
      .leftJoin("brokers", "sales.broker_id", "brokers.id")
      .orderBy("sales.id", "desc");

    if (status) query = query.where("sales.status", status);

    const rows = await query;
    const [{ count }] = await knex("sales").count({ count: "*" });

    return Response.json(
      { data: rows, total: Number(count) },
      { status: 200 }
    );
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = saleSchema.parse(body);

    const [id] = await knex("sales").insert(parsed);
    const created = await knex("sales").where({ id }).first();

    return Response.json(created, { status: 201 });
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }
}
