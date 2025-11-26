import {
  getAllBrokers,
  getBrokerById,
  createBroker,
  updateBroker,
  deleteBroker,
  findBrokerByEmail,
} from "@/lib/queries/brokerQueries";

import { brokerSchema } from "@/lib/validators/brokerSchema";

// ---------------------------------------------------------
// LIST BROKERS (Laravel: index())
// ---------------------------------------------------------
export async function listBrokers(page = 1) {
  return getAllBrokers(page, 10);
}

// ---------------------------------------------------------
// SHOW BROKER (Laravel: show($id))
// ---------------------------------------------------------
export async function showBroker(id) {
  const broker = await getBrokerById(id);
  if (!broker) throw new Error("Broker not found");
  return broker;
}

// ---------------------------------------------------------
// CREATE BROKER (Laravel: store())
// ---------------------------------------------------------
export async function createBrokerService(body) {
  // Validate (matches Laravel validation rules)
  const parsed = brokerSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const data = parsed.data;

  // Laravel: unique:brokers,email
  const existing = await findBrokerByEmail(data.email);
  if (existing) {
    throw new Error("Email already exists");
  }

  const broker = await createBroker(data);

  return {
    broker,
    message: "Broker created successfully.",
  };
}

// ---------------------------------------------------------
// UPDATE BROKER (Laravel: update())
// ---------------------------------------------------------
export async function updateBrokerService(id, body) {
  const broker = await getBrokerById(id);
  if (!broker) throw new Error("Broker not found");

  // Validate with ID (Laravel: unique:brokers,email,$id)
  const parsed = brokerSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const data = parsed.data;

  const exists = await findBrokerByEmail(data.email, id);
  if (exists) {
    throw new Error("Email already exists");
  }

  const updated = await updateBroker(id, data);

  return {
    broker: updated,
    message: "Broker updated successfully.",
  };
}

// ---------------------------------------------------------
// DELETE BROKER (Laravel: destroy())
// ---------------------------------------------------------
export async function deleteBrokerService(id) {
  const broker = await getBrokerById(id);
  if (!broker) throw new Error("Broker not found");

  await deleteBroker(id);

  return {
    message: "Broker deleted successfully.",
  };
}
