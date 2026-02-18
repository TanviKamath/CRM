import { userSchema } from "../../../lib/validators/userSchema.js";
import knex from "../../../lib/db.js";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = userSchema.parse(body);

    const existing = await knex("users").where("email", parsed.email).first();
    if (existing) return new Response("Email already exists", { status: 400 });

    const hashed = await bcrypt.hash(parsed.password, 10);
    const [id] = await knex("users").insert({
      name: parsed.name,
      email: parsed.email,
      password: hashed,
      subscription: parsed.subscription || "Basic",
      created_at: new Date(),
      updated_at: new Date(),
    });

    const user = await knex("users").where("id", id).first();
    delete user.password;
    return new Response(JSON.stringify(user), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err.errors ? JSON.stringify(err.errors) : err.message;
    return new Response(msg, { status: 400 });
  }
}
