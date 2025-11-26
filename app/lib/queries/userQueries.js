import db from "../../lib/db";

// Get user by email (used for login + registration)
export async function findUserByEmail(email) {
  return db("users").where({ email }).first();
}

// Create a new user (Laravel: User::create())
export async function createUser(data) {
  return db("users").insert(data);
}

// Get user by ID (useful for auth middleware, profile page, etc.)
export async function findUserById(id) {
  return db("users").where({ id }).first();
}

export async function markEmailVerified(id) {
  return db("users").where({ id }).update({
    email_verified_at: new Date(),
  });
}

export async function isEmailVerified(id) {
  const user = await db("users").where({ id }).first();
  return !!user?.email_verified_at;
}

export async function updateUser(id, data) {
  return db("users").where({ id }).update(data);
}