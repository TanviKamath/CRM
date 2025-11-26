import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  findClientByEmail,
} from "@/lib/queries/clientQueries";

import { clientSchema } from "@/lib/validators/clientSchema";

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
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) throw new Error("Validation failed");

  const data = parsed.data;

  // Laravel: unique:clients,email
  const exists = await findClientByEmail(data.email);
  if (exists) throw new Error("Email already exists");

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
  const exists = await findClientByEmail(data.email, id);
  if (exists) throw new Error("Email already exists");

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
