import db from "@/lib/db";

// ---------------------------------------------------------
// GET ALL DIAMONDS (pagination)
// Laravel: Diamond::latest()->paginate(10)
// ---------------------------------------------------------
export async function getAllDiamonds(page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const diamonds = await db("diamonds")
    .select("*")
    .orderBy("id", "desc")
    .limit(limit)
    .offset(offset);

  const total = await db("diamonds").count({ count: "*" }).first();

  return {
    data: diamonds,
    pagination: {
      total: Number(total.count),
      per_page: limit,
      current_page: page,
      last_page: Math.ceil(total.count / limit),
    },
  };
}

// ---------------------------------------------------------
// GET ONE DIAMOND
// Laravel: Diamond::findOrFail($id)
// ---------------------------------------------------------
export async function getDiamondById(id) {
  return db("diamonds").where({ id }).first();
}

// ---------------------------------------------------------
// CREATE DIAMOND
// Laravel: Diamond::create($validatedData)
// ---------------------------------------------------------
export async function createDiamond(data) {
  const [id] = await db("diamonds").insert(data);
  return getDiamondById(id);
}

// ---------------------------------------------------------
// UPDATE DIAMOND
// Laravel: $diamond->update($validatedData)
// ---------------------------------------------------------
export async function updateDiamond(id, data) {
  await db("diamonds").where({ id }).update(data);
  return getDiamondById(id);
}

// ---------------------------------------------------------
// DELETE DIAMOND
// Laravel: $diamond->delete()
// ---------------------------------------------------------
export async function deleteDiamond(id) {
  return db("diamonds").where({ id }).del();
}

// ---------------------------------------------------------
// EMAIL/UNIQUE CHECK (Laravel: unique:diamonds,certificate_number,$id)
// ---------------------------------------------------------
export async function findDiamondByCertificate(certNumber, excludeId = null) {
  let query = db("diamonds").where({ certificate_number: certNumber });

  if (excludeId) {
    query = query.whereNot("id", excludeId);
  }

  return query.first();
}
