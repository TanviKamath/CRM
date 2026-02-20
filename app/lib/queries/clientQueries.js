import db from "../db";

// ---------------------------------------------------------
// GET ALL CLIENTS (with pagination)
// Laravel: Client::latest()->paginate(10)
// ---------------------------------------------------------
export async function getAllClients(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const clients = await db("clients")
    .select("*")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(offset);

  const total = await db("clients").count({ count: "*" }).first();

  return {
    data: clients,
    pagination: {
      total: Number(total.count),
      per_page: limit,
      current_page: page,
      last_page: Math.ceil(total.count / limit),
    },
  };
}

// ---------------------------------------------------------
// GET SINGLE CLIENT
// Laravel: Client::findOrFail($id)
// ---------------------------------------------------------
export async function getClientById(id) {
  return db("clients").where({ id }).first();
}

// ---------------------------------------------------------
// CREATE CLIENT
// Laravel: Client::create($request->all())
// ---------------------------------------------------------
export async function createClient(data) {
  const [id] = await db("clients").insert(data);
  return getClientById(id);
}

// ---------------------------------------------------------
// UPDATE CLIENT
// Laravel: $client->update($request->all())
// ---------------------------------------------------------
export async function updateClient(id, data) {
  await db("clients").where({ id }).update(data);
  return getClientById(id);
}

// ---------------------------------------------------------
// DELETE CLIENT
// Laravel: $client->delete()
// ---------------------------------------------------------
export async function deleteClient(id) {
  return db("clients").where({ id }).del();
}

// ---------------------------------------------------------
// UNIQUE EMAIL CHECK
// Laravel: unique:clients,email,$id
// ---------------------------------------------------------
export async function findClientByEmail(email, excludeId = null) {
  let query = db("clients").where({ email });

  if (excludeId) {
    query = query.whereNot("id", excludeId);
  }

  return query.first();
}
