import bcrypt from "bcryptjs";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  findClientByEmail,
} from "../../lib/queries/clientQueries";

import { clientSchema } from "../../lib/validators/clientSchema";

// ---------------------------------------------------------
// LIST CLIENTS (Laravel: index())
// ---------------------------------------------------------
export async function listClients(page = 1) {
  return getAllClients(page, 10);
}

// ---------------------------------------------------------
// SHOW CLIENT (Laravel: show($id))
// ---------------------------------------------------------
export async function showClient(id) {
  const client = await getClientById(id);
  if (!client) throw new Error("Client not found");
  return client;
}

// ---------------------------------------------------------
// CREATE CLIENT (Laravel: store())
// ---------------------------------------------------------
export async function createClientService(body) {
  console.log("Service: Received body:", body);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Service: Validation failed:", parsed.error);
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten()));
  }

  const data = parsed.data;

  // Remove confirm_password as it's not a DB column
  if ('confirm_password' in data) {
    delete data.confirm_password;
  }

  // Laravel: unique:clients,email
  if (data.email) {
    const exists = await findClientByEmail(data.email);
    if (exists) throw new Error("Email already exists");
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const client = await createClient(data);

  return {
    client,
    message: "Client created successfully.",
  };
}

// ---------------------------------------------------------
// UPDATE CLIENT (Laravel: update())
// ---------------------------------------------------------
export async function updateClientService(id, body) {
  const client = await getClientById(id);
  if (!client) throw new Error("Client not found");

  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const data = parsed.data;

  // Laravel: unique:clients,email,$id
  if (data.email) {
    const exists = await findClientByEmail(data.email, id);
    if (exists) throw new Error("Email already exists");
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await updateClient(id, data);

  return {
    client: updated,
    message: "Client updated successfully.",
  };
}

// ---------------------------------------------------------
// DELETE CLIENT (Laravel: destroy())
// ---------------------------------------------------------
export async function deleteClientService(id) {
  const client = await getClientById(id);
  if (!client) throw new Error("Client not found");

  await deleteClient(id);

  return {
    message: "Client deleted successfully.",
  };
}
