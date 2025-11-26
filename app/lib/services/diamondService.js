import {
  getAllDiamonds,
  getDiamondById,
  createDiamond,
  updateDiamond,
  deleteDiamond,
  findDiamondByCertificate,
} from "@/lib/queries/diamondQueries";

import { diamondSchema } from "@/lib/validators/diamondSchema";

// ---------------------------------------------------------
// LIST DIAMONDS (Laravel index())
// ---------------------------------------------------------
export async function listDiamonds(page = 1) {
  return getAllDiamonds(page, 10);
}

// ---------------------------------------------------------
// SHOW DIAMOND (Laravel show())
// ---------------------------------------------------------
export async function showDiamond(id) {
  const diamond = await getDiamondById(id);
  if (!diamond) throw new Error("Diamond not found");
  return diamond;
}

// ---------------------------------------------------------
// CREATE DIAMOND (Laravel store())
// ---------------------------------------------------------
export async function createDiamondService(body) {
  const parsed = diamondSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const data = parsed.data;

  // Laravel: unique:diamonds,certificate_number
  const exists = await findDiamondByCertificate(data.certificate_number);
  if (exists) throw new Error("Certificate number already exists");

  // --- PRICE CALCULATIONS (Laravel logic mirrored) ---

  const weight = Number(data.weight);
  const rapRate = Number(data.rap_rate);
  const rapDiscount = Number(data.rap_discount);

  // Calculate price per carat
  data.price_per_carat_usd = rapRate * (1 - rapDiscount / 100);

  // Total USD amount
  data.amount_usd = weight * data.price_per_carat_usd;

  // INR conversion
  if (data.conversion_rate) {
    data.amount_inr = data.amount_usd * Number(data.conversion_rate);
  }

  // Purchase price logic
  const purDiscount = Number(data.pur_rap_discount);
  data.purchase_price = weight * rapRate * (1 - purDiscount / 100);

  if (data.purchase_conversion_rate) {
    data.purchase_price_inr =
      data.purchase_price * Number(data.purchase_conversion_rate);
  }

  const diamond = await createDiamond(data);

  return {
    diamond,
    message: "Diamond created successfully.",
  };
}

// ---------------------------------------------------------
// UPDATE DIAMOND (Laravel update())
// ---------------------------------------------------------
export async function updateDiamondService(id, body) {
  const existing = await getDiamondById(id);
  if (!existing) throw new Error("Diamond not found");

  const parsed = diamondSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const data = parsed.data;

  // unique check for certificate number
  const exists = await findDiamondByCertificate(
    data.certificate_number,
    id
  );
  if (exists) throw new Error("Certificate number already exists");

  // --- PRICE CALCULATIONS (Laravel logic) ---

  const weight = Number(data.weight);
  const rapRate = Number(data.rap_rate);
  const rapDiscount = Number(data.rap_discount);

  data.price_per_carat_usd = rapRate * (1 - rapDiscount / 100);
  data.amount_usd = weight * data.price_per_carat_usd;

  if (data.conversion_rate) {
    data.amount_inr = data.amount_usd * Number(data.conversion_rate);
  }

  const purDiscount = Number(data.pur_rap_discount);
  data.purchase_price = weight * rapRate * (1 - purDiscount / 100);

  if (data.purchase_conversion_rate) {
    data.purchase_price_inr =
      data.purchase_price * Number(data.purchase_conversion_rate);
  }

  const updated = await updateDiamond(id, data);

  return {
    diamond: updated,
    message: "Diamond updated successfully.",
  };
}

// ---------------------------------------------------------
// DELETE DIAMOND (Laravel destroy())
// ---------------------------------------------------------
export async function deleteDiamondService(id) {
  const existing = await getDiamondById(id);
  if (!existing) throw new Error("Diamond not found");

  await deleteDiamond(id);

  return {
    message: "Diamond deleted successfully.",
  };
}
