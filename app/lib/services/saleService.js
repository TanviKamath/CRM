import {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  getDiamondById,
  updateDiamondAvailability,
} from "@/lib/queries/saleQueries";

import { saleSchema } from "@/lib/validators/saleSchema";

// ------------------------------
// GET LIST
// ------------------------------
export async function listSales() {
  return await getAllSales();
}

// ------------------------------
// GET ONE
// ------------------------------
export async function showSale(id) {
  const sale = await getSaleById(id);
  if (!sale) throw new Error("Sale not found");
  return sale;
}

// ------------------------------
// CREATE
// ------------------------------
export async function createNewSale(body) {
  const parsed = saleSchema.parse(body);

  // Auto brokerage
  if (parsed.brokerage_rate && parsed.sale_amount) {
    parsed.brokerage_amount =
      parsed.sale_amount * (parsed.brokerage_rate / 100);
  }

  // Auto INR
  if (parsed.conversion_rate && parsed.sale_amount) {
    parsed.sale_amount_inr =
      parsed.sale_amount * parsed.conversion_rate;
  }

  // Create sale
  const [id] = await createSale(parsed);

  // On completed update diamond availability
  if (parsed.status === "completed") {
    await updateDiamondAvailability(parsed.diamond_id, "sold");
  }

  return await getSaleById(id);
}

// ------------------------------
// UPDATE
// ------------------------------
export async function updateExistingSale(id, body) {
  const parsed = saleSchema.parse(body);

  const existing = await getSaleById(id);
  if (!existing) throw new Error("Sale not found");

  const oldDiamondId = existing.diamond_id;
  const oldStatus = existing.status;

  const newDiamondId = parsed.diamond_id;
  const newStatus = parsed.status;

  // Brokerage auto-calc
  if (parsed.brokerage_rate && parsed.sale_amount) {
    parsed.brokerage_amount =
      parsed.sale_amount * (parsed.brokerage_rate / 100);
  }

  // INR auto-calc
  if (parsed.conversion_rate && parsed.sale_amount) {
    parsed.sale_amount_inr =
      parsed.sale_amount * parsed.conversion_rate;
  }

  // Update the sale
  await updateSale(id, parsed);

  // ------------------------------
  // Availability Logic (Laravel exact)
  // ------------------------------

  const diamondChanged = oldDiamondId !== newDiamondId;

  if (diamondChanged) {
    // revert old diamond if sale was completed
    if (oldStatus === "completed") {
      await updateDiamondAvailability(oldDiamondId, "available");
    }

    // new diamond sale
    if (newStatus === "completed") {
      await updateDiamondAvailability(newDiamondId, "sold");
    }
  } else if (oldStatus !== newStatus) {
    // same diamond status change
    if (newStatus === "completed") {
      await updateDiamondAvailability(newDiamondId, "sold");
    } else if (newStatus === "cancelled" && oldStatus === "completed") {
      await updateDiamondAvailability(newDiamondId, "available");
    }
  }

  return await getSaleById(id);
}

// ------------------------------
// DELETE
// ------------------------------
export async function removeSale(id) {
  const sale = await getSaleById(id);
  if (!sale) throw new Error("Sale not found");

  if (sale.status === "completed") {
    await updateDiamondAvailability(sale.diamond_id, "available");
  }

  await deleteSale(id);

  return { message: "Sale deleted successfully" };
}
