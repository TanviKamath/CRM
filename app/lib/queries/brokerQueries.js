import db from "../db";

// ---------------------------------------------------------
// GET ALL BROKERS (with pagination)
// Laravel: Broker::latest()->paginate(10)
// ---------------------------------------------------------
export async function getAllBrokers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const brokers = await db("brokers")
    .select("*")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(offset);

  const total = await db("brokers").count({ count: "*" }).first();

  return {
    data: brokers,
    pagination: {
      total: Number(total.count),
      per_page: limit,
      current_page: page,
      last_page: Math.ceil(total.count / limit),
    },
  };
}

// ---------------------------------------------------------
// GET ONE BROKER
// Laravel: Broker::findOrFail($id)
// ---------------------------------------------------------
export async function getBrokerById(id) {
  return db("brokers").where({ id }).first();
}

// ---------------------------------------------------------
// CREATE BROKER
// Laravel: Broker::create($request->all())
// ---------------------------------------------------------
export async function createBroker(data) {
  const [id] = await db("brokers").insert(data);
  return getBrokerById(id);
}

// ---------------------------------------------------------
// UPDATE BROKER
// Laravel: $broker->update($request->all())
// ---------------------------------------------------------
export async function updateBroker(id, data) {
  await db("brokers").where({ id }).update(data);
  return getBrokerById(id);
}

// ---------------------------------------------------------
// DELETE BROKER
// Laravel: $broker->delete()
// ---------------------------------------------------------
export async function deleteBroker(id) {
  return db("brokers").where({ id }).del();
}

// ---------------------------------------------------------
// CHECK EMAIL UNIQUE (Laravel: unique:brokers,email,$id)
// ---------------------------------------------------------
export async function findBrokerByEmail(email, excludeId = null) {
  let query = db("brokers").where({ email });

  if (excludeId) {
    query = query.whereNot("id", excludeId);
  }

  return query.first();
}
