import db from "@/lib/db";

export async function createPasswordReset(email, token) {
  // Laravel deletes old tokens before inserting a new one
  await db("password_resets").where({ email }).delete();

  return db("password_resets").insert({
    email,
    token,
    created_at: new Date(),
  });
}
// Find password reset record
export async function findPasswordReset(email, token) {
  return db("password_resets")
    .where({ email, token })
    .first();
}

// Delete password reset entry after success
export async function deletePasswordReset(email) {
  return db("password_resets").where({ email }).delete();
}


