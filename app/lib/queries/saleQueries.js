import db from "@/lib/db";

// ------------------------------
// BASIC CRUD
// ------------------------------
export function getAllSales() {
  return db("sales as s")
    .leftJoin("diamonds as d", "s.diamond_id", "d.id")
    .leftJoin("clients as c", "s.client_id", "c.id")
    .leftJoin("brokers as b", "s.broker_id", "b.id")
    .select(
      "s.*",
      "d.certificate_number as diamond_certificate_number",
      "c.company_name as client_company_name",
      "b.name as broker_name"
    )
    .orderBy("s.id", "desc");
}

export function getSaleById(id) {
  return db("sales as s")
    .leftJoin("diamonds as d", "s.diamond_id", "d.id")
    .leftJoin("clients as c", "s.client_id", "c.id")
    .leftJoin("brokers as b", "s.broker_id", "b.id")
    .select(
      "s.*",
      "d.certificate_number as diamond_certificate_number",
      "c.company_name as client_company_name",
      "b.name as broker_name"
    )
    .where("s.id", id)
    .first();
}

export function createSale(data) {
  return db("sales").insert(data);
}

export function updateSale(id, data) {
  return db("sales").where({ id }).update(data);
}

export function deleteSale(id) {
  return db("sales").where({ id }).del();
}

// ------------------------------
// RELATED HELPERS
// ------------------------------
export function getDiamondById(id) {
  return db("diamonds").where({ id }).first();
}

export function updateDiamondAvailability(id, status) {
  return db("diamonds").where({ id }).update({ availability: status });
}
